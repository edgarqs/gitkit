const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

function repoNameFromUrl(url) {
  return url.trim().replace(/\.git$/, '').split(/[/:]/).pop();
}

function detectPackageManager(dir) {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return { name: 'pnpm', cmd: 'pnpm install' };
    if (fs.existsSync(path.join(dir, 'yarn.lock')))      return { name: 'yarn', cmd: 'yarn install' };
    return { name: 'npm', cmd: 'npm install' };
  }
  if (fs.existsSync(path.join(dir, 'composer.json')))    return { name: 'composer', cmd: 'composer install' };
  if (fs.existsSync(path.join(dir, 'Pipfile')))          return { name: 'pipenv',   cmd: 'pipenv install' };
  if (fs.existsSync(path.join(dir, 'requirements.txt'))) return { name: 'pip',      cmd: 'pip install -r requirements.txt' };
  return null;
}

async function runClone(url, options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();
  const repoName = repoNameFromUrl(url);
  const targetDir = path.join(workDir, repoName);

  console.log(chalk.bold('\n  gitkit clone'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  Destino: ${chalk.cyan(targetDir)}\n`);

  const cloneSpinner = ora(`git clone ${url}`).start();
  try {
    await simpleGit().clone(url, targetDir);
    cloneSpinner.succeed(chalk.green(`Clonado en ${repoName}/`));
  } catch (err) {
    cloneSpinner.fail(chalk.red('Clone fallido'));
    console.error(chalk.red(`  ${err.message}`));
    process.exit(1);
  }

  const git = simpleGit(targetDir);
  let log, status;
  try {
    [log, status] = await Promise.all([
      git.log({ maxCount: 1 }).catch(() => null),
      git.status().catch(() => null),
    ]);
  } catch (_) {}

  console.log();
  if (status) console.log(`  Rama:    ${chalk.cyan(status.current)}`);
  if (log && log.latest) {
    console.log(`  Último:  ${chalk.dim(`"${log.latest.message}"`)}  ·  ${chalk.dim(log.latest.author_name)}`);
  }

  const pm = detectPackageManager(targetDir);

  if (!pm) {
    console.log('\n' + chalk.green.bold(`  ✓ Listo. Entra con: cd ${repoName}\n`));
    return;
  }

  console.log(`\n  Package manager detectado: ${chalk.cyan(pm.name)}`);

  const { install } = await inquirer.prompt([{
    type: 'confirm',
    name: 'install',
    message: `¿Instalar dependencias ahora? (${pm.cmd})`,
    default: true,
  }]);

  if (!install) {
    console.log('\n' + chalk.green.bold(`  ✓ Listo. Entra con: cd ${repoName}\n`));
    return;
  }

  const installSpinner = ora(pm.cmd).start();
  try {
    await execAsync(pm.cmd, { cwd: targetDir });
    installSpinner.succeed(chalk.green(`Dependencias instaladas (${pm.name})`));
  } catch (err) {
    installSpinner.fail(chalk.red(`${pm.cmd} fallido`));
    console.error(chalk.red(`  ${err.message}`));
    process.exit(1);
  }

  console.log('\n' + chalk.green.bold(`  ✓ Listo. Entra con: cd ${repoName}\n`));
}

module.exports = { runClone };
