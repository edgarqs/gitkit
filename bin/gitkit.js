#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const { version } = require('../package.json');

program
  .name('gitkit')
  .description('CLI tool that simplifies common Git workflows')
  .version(version);

program
  .command('clone <url>')
  .description('Clone a repo and auto-install dependencies')
  .option('--path <dir>', 'Parent directory to clone into (default: cwd)')
  .action((url, options) => {
    const { runClone } = require('../src/commands/clone');
    runClone(url, options);
  });

program
  .command('init')
  .description('Full repo setup: git init + .gitignore + commit + push')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .action((options) => {
    const { runInit } = require('../src/commands/init');
    runInit(options);
  });

program
  .command('push [message]')
  .description('Quick push: git add . + commit + push')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .action((message, options) => {
    const { runPush } = require('../src/commands/push');
    runPush(message, options);
  });

program
  .command('sync [message]')
  .description('Sync: pull + add + commit + push in one step')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .action((message, options) => {
    const { runSync } = require('../src/commands/sync');
    runSync(message, options);
  });

const ignore = program.command('ignore').description('Manage .gitignore templates');

ignore
  .command('list')
  .description('Show available templates')
  .action(() => {
    const { runIgnoreList } = require('../src/commands/ignore');
    runIgnoreList();
  });

ignore
  .command('add <template>')
  .description('Apply a template to .gitignore (merges, no duplicates)')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .action((template, options) => {
    const { runIgnoreAdd } = require('../src/commands/ignore');
    runIgnoreAdd(template, options);
  });

program
  .command('branch [name]')
  .description('List, create, or delete local branches')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .option('--push', 'Push new branch to origin after creating')
  .option('-d, --delete <name>', 'Delete a local branch')
  .action((name, options) => {
    const { runBranch } = require('../src/commands/branch');
    runBranch(name, options);
  });

program
  .command('log')
  .description('Compact colorized commit history')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .option('-n <count>', 'Number of commits to show (default: 15)')
  .option('--all', 'Show commits from all branches')
  .action((options) => {
    const { runLog } = require('../src/commands/log');
    runLog(options);
  });

program
  .command('status')
  .description('Visual repo status dashboard')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .action((options) => {
    const { runStatus } = require('../src/commands/status');
    runStatus(options);
  });

program
  .command('undo')
  .description('Undo last commit — soft by default, keeps changes')
  .option('--path <dir>', 'Target directory (default: cwd)')
  .option('--hard', 'Discard changes permanently (irreversible)')
  .action((options) => {
    const { runUndo } = require('../src/commands/undo');
    runUndo(options);
  });

program.parse(process.argv);
