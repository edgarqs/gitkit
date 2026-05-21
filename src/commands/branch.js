const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const simpleGit = require('simple-git');

async function runBranch(name, options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const git = simpleGit(workDir);

  if (options.delete) {
    await deleteBranch(git, options.delete);
  } else if (name) {
    await createBranch(git, name, options.push);
  } else {
    await listBranches(git);
  }
}

async function listBranches(git) {
  let raw;
  try {
    raw = await git.raw([
      'for-each-ref',
      '--sort=-committerdate',
      'refs/heads/',
      '--format=%(refname:short)|%(objectname:short)|%(committerdate:relative)|%(subject)|%(HEAD)',
    ]);
  } catch (err) {
    console.error(chalk.red(`Error reading branches: ${err.message}`));
    process.exit(1);
  }

  const lines = raw.trim().split('\n').filter(Boolean);
  if (!lines.length) {
    console.log(chalk.dim('\n  Sin ramas locales.\n'));
    return;
  }

  console.log(chalk.bold('\n  Ramas locales'));
  console.log(chalk.dim('  ─────────────────────────────────────'));

  lines.forEach((line) => {
    const [branchName, hash, relDate, subject, head] = line.split('|');
    const isCurrent = head === '*';
    const marker = isCurrent ? chalk.green('*') : ' ';
    const nameStr = isCurrent ? chalk.green.bold(branchName) : chalk.white(branchName);
    const hashStr = chalk.dim(hash);
    const dateStr = chalk.yellow(relDate.trim());
    const subjectStr = chalk.dim(`"${subject}"`);

    console.log(`  ${marker} ${nameStr.padEnd(28)}${hashStr}  ${dateStr.padEnd(24)}${subjectStr}`);
  });

  console.log();
}

async function createBranch(git, name, pushToRemote) {
  console.log(chalk.bold(`\n  Creando rama: ${chalk.cyan(name)}\n`));

  const spinner = ora(`git checkout -b ${name}`).start();
  try {
    await git.checkoutLocalBranch(name);
    spinner.succeed(chalk.green(`Rama creada y activada: ${name}`));
  } catch (err) {
    spinner.fail(chalk.red(`No se pudo crear la rama "${name}"`));
    console.error(chalk.red(`  ${err.message}`));
    process.exit(1);
  }

  if (pushToRemote) {
    const spinner2 = ora(`git push -u origin ${name}`).start();
    try {
      await git.push(['-u', 'origin', name]);
      spinner2.succeed(chalk.green(`Rama publicada en origin/${name}`));
    } catch (err) {
      spinner2.fail(chalk.red('Push fallido'));
      console.error(chalk.red(`  ${err.message}`));
      process.exit(1);
    }
  }

  console.log(`\n  ${chalk.green('✓')} Ahora en rama ${chalk.cyan(name)}\n`);
}

async function deleteBranch(git, name) {
  // Check if branch exists
  let branches;
  try {
    branches = await git.branchLocal();
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }

  if (!branches.all.includes(name)) {
    console.error(chalk.red(`Rama "${name}" no existe localmente.`));
    process.exit(1);
  }

  if (branches.current === name) {
    console.error(chalk.red(`No puedes eliminar la rama en la que estás (${name}).`));
    process.exit(1);
  }

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: `Eliminar rama "${name}"?`,
    default: false,
  }]);

  if (!confirmed) {
    console.log(chalk.yellow('Abortado.'));
    process.exit(0);
  }

  const spinner = ora(`Eliminando ${name}...`).start();
  try {
    await git.deleteLocalBranch(name, true);
    spinner.succeed(chalk.green(`Rama "${name}" eliminada`));
  } catch (err) {
    spinner.fail(chalk.red(`No se pudo eliminar "${name}"`));
    console.error(chalk.red(`  ${err.message}`));
    process.exit(1);
  }

  console.log();
}

module.exports = { runBranch };
