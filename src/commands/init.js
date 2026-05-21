const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const simpleGit = require('simple-git');

async function runInit(options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  console.log(chalk.bold('\n  gitkit init'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  Working directory: ${chalk.cyan(workDir)}\n`);

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: 'Proceed in this directory?',
    default: true,
  }]);

  if (!confirmed) {
    console.log(chalk.yellow('Aborted.'));
    process.exit(0);
  }

  const { template } = await inquirer.prompt([{
    type: 'list',
    name: 'template',
    message: 'Select a .gitignore template:',
    choices: [
      { name: 'Laravel', value: 'laravel' },
      { name: 'Node.js', value: 'node' },
      { name: 'Python', value: 'python' },
      { name: 'Full (all common patterns)', value: 'full' },
      { name: 'None', value: 'none' },
    ],
  }]);

  const git = simpleGit(workDir);

  await runStep('git init', () => git.init());

  if (template !== 'none') {
    await runStep(`Apply .gitignore (${template})`, () => {
      const templatePath = path.join(__dirname, '../templates', `${template}.gitignore`);
      const content = fs.readFileSync(templatePath, 'utf8');
      fs.writeFileSync(path.join(workDir, '.gitignore'), content, 'utf8');
    });
  }

  await runStep('git add .', () => git.add('.'));

  const { commitMessage } = await inquirer.prompt([{
    type: 'input',
    name: 'commitMessage',
    message: 'First commit message:',
    default: 'Initial commit',
  }]);

  await runStep(`git commit: "${commitMessage}"`, () => git.commit(commitMessage));

  const { repoUrl } = await inquirer.prompt([{
    type: 'input',
    name: 'repoUrl',
    message: 'GitHub repository URL (HTTPS or SSH):',
    validate: (input) => {
      const trimmed = input.trim();
      if (trimmed.startsWith('https://') || trimmed.startsWith('git@')) return true;
      return 'Invalid URL. Must start with https:// or git@';
    },
  }]);

  const url = repoUrl.trim();
  const urlType = url.startsWith('https://') ? 'HTTPS' : 'SSH';

  await runStep(`git remote add origin (${urlType})`, () => git.addRemote('origin', url));
  await runStep('git branch -M main', () => git.raw(['branch', '-M', 'main']));
  await runStep('git push -u origin main', () => git.push(['-u', 'origin', 'main']));

  console.log('\n' + chalk.green.bold('  ✓ Repository initialized successfully!'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  URL:    ${chalk.cyan(url)}`);
  console.log(`  Branch: ${chalk.cyan('main')}`);
  console.log(`  Format: ${chalk.cyan(urlType)}\n`);
}

async function runStep(label, fn) {
  const spinner = ora(label).start();
  try {
    await fn();
    spinner.succeed(chalk.green(label));
  } catch (err) {
    spinner.fail(chalk.red(label));
    console.error(chalk.red(`  ${err.message}`));
    process.exit(1);
  }
}

module.exports = { runInit };
