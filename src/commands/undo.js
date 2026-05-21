const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const simpleGit = require('simple-git');

async function runUndo(options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const git = simpleGit(workDir);

  // Get last commit info to show the user what will be undone
  let lastCommit;
  try {
    const log = await git.log({ maxCount: 1 });
    if (!log.total) {
      console.error(chalk.red('No commits found — nothing to undo.'));
      process.exit(1);
    }
    lastCommit = log.latest;
  } catch (err) {
    console.error(chalk.red(`Could not read git log: ${err.message}`));
    process.exit(1);
  }

  console.log(chalk.bold('\n  gitkit undo'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  Last commit: ${chalk.cyan(lastCommit.message)}`);
  console.log(`  Hash:        ${chalk.dim(lastCommit.hash.slice(0, 7))}`);
  console.log(`  Author:      ${chalk.dim(lastCommit.author_name)}\n`);

  if (options.hard) {
    // Hard mode — destructive, requires explicit confirmation
    console.log(chalk.red.bold('  WARNING: --hard will permanently delete all changes from this commit.'));
    console.log(chalk.red('  This cannot be undone.\n'));

    const { confirmed } = await inquirer.prompt([{
      type: 'input',
      name: 'confirmed',
      message: 'Type "yes" to confirm permanent deletion of changes:',
      validate: (input) => ['yes', 'no', ''].includes(input.trim().toLowerCase()) || 'Type "yes" to confirm or leave empty to cancel.',
    }]);

    if (confirmed.trim().toLowerCase() !== 'yes') {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }

    const spinner = ora('Undoing commit and discarding changes...').start();
    try {
      await git.reset(['--hard', 'HEAD~1']);
      spinner.succeed(chalk.green('Commit undone — changes permanently discarded'));
    } catch (err) {
      spinner.fail(chalk.red('git reset --hard failed'));
      console.error(chalk.red(`  ${err.message}`));
      process.exit(1);
    }
  } else {
    // Soft mode — safe, changes return to working directory
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Undo this commit? (changes will be kept in your working directory)',
      default: true,
    }]);

    if (!confirmed) {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }

    const spinner = ora('Undoing commit...').start();
    try {
      await git.reset(['--soft', 'HEAD~1']);
      spinner.succeed(chalk.green('Commit undone — changes preserved in working directory'));
    } catch (err) {
      spinner.fail(chalk.red('git reset --soft failed'));
      console.error(chalk.red(`  ${err.message}`));
      process.exit(1);
    }
  }

  console.log(`\n  Undid: ${chalk.cyan(`"${lastCommit.message}"`)}\n`);
}

module.exports = { runUndo };
