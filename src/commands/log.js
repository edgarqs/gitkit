const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const simpleGit = require('simple-git');

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}sem`;
}

async function runLog(options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const maxCount = parseInt(options.n, 10) || 15;
  const git = simpleGit(workDir);

  let log;
  try {
    const logOptions = { maxCount };
    if (options.all) logOptions['--all'] = null;
    log = await git.log(logOptions);
  } catch (err) {
    console.error(chalk.red(`Error reading log: ${err.message}`));
    process.exit(1);
  }

  if (!log.total) {
    console.log(chalk.dim('\n  Sin commits.\n'));
    return;
  }

  // Get current branch for context
  let currentBranch = '';
  try {
    const status = await git.status();
    currentBranch = status.current;
  } catch (_) {}

  console.log(chalk.bold(`\n  Historial${options.all ? ' (todas las ramas)' : ` — ${chalk.cyan(currentBranch)}`}`));
  console.log(chalk.dim('  ─────────────────────────────────────'));

  log.all.forEach((commit, i) => {
    const hash = chalk.dim(commit.hash.slice(0, 7));
    const time = chalk.yellow(('hace ' + timeAgo(commit.date)).padEnd(14));
    const author = chalk.cyan(commit.author_name.slice(0, 16).padEnd(17));
    const message = i === 0
      ? chalk.white.bold(commit.message)
      : chalk.white(commit.message);
    const tag = i === 0 ? chalk.green(' ← HEAD') : '';

    console.log(`  ${hash}  ${time}${author}${message}${tag}`);
  });

  console.log(chalk.dim(`\n  Mostrando ${log.all.length} de ${log.total} commits totales`));
  if (log.total > maxCount) {
    console.log(chalk.dim(`  Usa -n <número> para ver más. Ej: gitkit log -n 30`));
  }
  console.log();
}

module.exports = { runLog };
