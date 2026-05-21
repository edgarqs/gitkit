const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const simpleGit = require('simple-git');

async function runPush(message, options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const git = simpleGit(workDir);

  await runStep('git add .', () => git.add('.'));

  const status = await git.status();
  const hasChanges =
    status.staged.length > 0 ||
    status.modified.length > 0 ||
    status.not_added.length > 0 ||
    status.created.length > 0 ||
    status.deleted.length > 0;

  if (!hasChanges) {
    console.log('\n' + chalk.yellow('  Sin cambios para commit.\n'));
    process.exit(0);
  }

  let commitMessage = message;
  if (!commitMessage) {
    const { msg } = await inquirer.prompt([{
      type: 'input',
      name: 'msg',
      message: 'Commit message:',
      validate: (input) => input.trim() ? true : 'Commit message cannot be empty.',
    }]);
    commitMessage = msg.trim();
  }

  await runStep(`git commit: "${commitMessage}"`, () => git.commit(commitMessage));
  await runStep('git push', () => git.push());

  console.log('\n' + chalk.green.bold('  ✓ Pushed successfully!\n'));
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

module.exports = { runPush };
