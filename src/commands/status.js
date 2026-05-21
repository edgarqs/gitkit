const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const simpleGit = require('simple-git');

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

function fileLabel(file) {
  // simple-git returns objects with .path and .index/.working_dir
  return typeof file === 'string' ? file : file.path;
}

function suggest(status, ahead, behind, hasStaged, hasUnstaged, hasUntracked) {
  if (status.conflicted.length > 0)
    return chalk.red('→ Tienes conflictos. Resuélvelos antes de continuar.');
  if (behind > 0)
    return chalk.yellow(`→ Estás ${behind} commit(s) detrás de origin. Haz git pull primero.`);
  if (hasStaged)
    return chalk.cyan('→ Tienes cambios staged. Ejecuta: gitkit push "mensaje"');
  if (hasUnstaged || hasUntracked)
    return chalk.cyan('→ Tienes cambios sin stagear. Ejecuta: gitkit push "mensaje"');
  if (ahead > 0)
    return chalk.cyan(`→ Tienes ${ahead} commit(s) sin pushear. Ejecuta: gitkit push`);
  return chalk.green('→ Working tree limpio. Todo sincronizado.');
}

async function runStatus(options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const git = simpleGit(workDir);

  let status, log, stashList;

  try {
    [status, log, stashList] = await Promise.all([
      git.status(),
      git.log({ maxCount: 1 }).catch(() => null),
      git.stashList().catch(() => ({ total: 0 })),
    ]);
  } catch (err) {
    console.error(chalk.red(`Error reading repo: ${err.message}`));
    process.exit(1);
  }

  const ahead = status.ahead || 0;
  const behind = status.behind || 0;
  const branch = status.current || 'unknown';

  // Build branch line
  let branchLine = chalk.bold.cyan(branch);
  if (ahead > 0 && behind > 0) {
    branchLine += chalk.yellow(`  ↑${ahead} adelante  ↓${behind} atrás de origin/${branch}`);
  } else if (ahead > 0) {
    branchLine += chalk.yellow(`  ↑${ahead} adelante de origin/${branch}`);
  } else if (behind > 0) {
    branchLine += chalk.red(`  ↓${behind} atrás de origin/${branch}`);
  } else if (status.tracking) {
    branchLine += chalk.green(`  ✓ sincronizado con origin/${branch}`);
  }

  // Categorize files
  // staged: index modified/added/deleted
  const staged = [
    ...status.staged.map((f) => ({ prefix: chalk.green('M '), path: fileLabel(f) })),
    ...status.created.map((f) => ({ prefix: chalk.green('A '), path: fileLabel(f) })),
    ...status.deleted.filter((f) => status.staged.includes(fileLabel(f))).map((f) => ({ prefix: chalk.red('D '), path: fileLabel(f) })),
  ];

  const unstaged = status.modified
    .filter((f) => !status.staged.includes(fileLabel(f)))
    .map((f) => ({ prefix: chalk.yellow('M '), path: fileLabel(f) }));

  const untracked = status.not_added.map((f) => ({ prefix: chalk.dim('? '), path: fileLabel(f) }));
  const conflicted = status.conflicted.map((f) => ({ prefix: chalk.red('! '), path: fileLabel(f) }));

  const hasStaged = staged.length > 0;
  const hasUnstaged = unstaged.length > 0;
  const hasUntracked = untracked.length > 0;

  // Render
  console.log(chalk.bold('\n  gitkit status'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  Branch:  ${branchLine}`);

  if (log && log.latest) {
    const c = log.latest;
    console.log(`  Último:  ${chalk.italic(`"${c.message}"`)}  ·  ${chalk.dim(timeAgo(c.date))}  ·  ${chalk.dim(c.hash.slice(0, 7))}`);
  } else {
    console.log(`  Último:  ${chalk.dim('sin commits')}`);
  }

  console.log();

  if (conflicted.length > 0) {
    console.log(chalk.red.bold(`  Conflictos (${conflicted.length})`));
    conflicted.forEach((f) => console.log(`    ${f.prefix}${f.path}`));
    console.log();
  }

  if (hasStaged) {
    console.log(chalk.green.bold(`  Staged (${staged.length})`) + chalk.dim('          → incluidos en próximo commit'));
    staged.forEach((f) => console.log(`    ${f.prefix}${f.path}`));
    console.log();
  }

  if (hasUnstaged) {
    console.log(chalk.yellow.bold(`  Unstaged (${unstaged.length})`) + chalk.dim('        → no incluidos en próximo commit'));
    unstaged.forEach((f) => console.log(`    ${f.prefix}${f.path}`));
    console.log();
  }

  if (hasUntracked) {
    console.log(chalk.dim.bold(`  Untracked (${untracked.length})`) + chalk.dim('       → sin rastrear'));
    untracked.forEach((f) => console.log(`    ${f.prefix}${f.path}`));
    console.log();
  }

  if (!hasStaged && !hasUnstaged && !hasUntracked && conflicted.length === 0) {
    console.log(chalk.dim('  Sin cambios.\n'));
  }

  if (stashList.total > 0) {
    console.log(`  Stashes: ${chalk.yellow(stashList.total)}\n`);
  }

  console.log('  ' + suggest(status, ahead, behind, hasStaged, hasUnstaged, hasUntracked));
  console.log(chalk.dim('  ─────────────────────────────────────\n'));
}

module.exports = { runStatus };
