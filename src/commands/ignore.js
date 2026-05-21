const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const TEMPLATES = ['laravel', 'node', 'python', 'full'];

function runIgnoreList() {
  console.log(chalk.bold('\nAvailable .gitignore templates:'));
  TEMPLATES.forEach((t) => console.log(`  ${chalk.cyan(t)}`));
  console.log();
}

async function runIgnoreAdd(template, options) {
  const workDir = options.path ? path.resolve(options.path) : process.cwd();

  if (!fs.existsSync(workDir) || !fs.statSync(workDir).isDirectory()) {
    console.error(chalk.red(`Error: Directory "${workDir}" does not exist or is not accessible.`));
    process.exit(1);
  }

  const normalized = template.toLowerCase();
  if (!TEMPLATES.includes(normalized)) {
    console.error(chalk.red(`Unknown template "${template}".`));
    console.error(`Run ${chalk.cyan('gitkit ignore list')} to see available templates.`);
    process.exit(1);
  }

  const templatePath = path.join(__dirname, '../templates', `${normalized}.gitignore`);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const gitignorePath = path.join(workDir, '.gitignore');

  if (fs.existsSync(gitignorePath)) {
    const existing = fs.readFileSync(gitignorePath, 'utf8');
    const existingLines = new Set(
      existing.split('\n').map((l) => l.trim()).filter(Boolean)
    );

    const newLines = templateContent
      .split('\n')
      .filter((l) => l.trim() && !existingLines.has(l.trim()));

    if (newLines.length === 0) {
      console.log(chalk.yellow('No new entries — .gitignore already contains all template lines.'));
      return;
    }

    const merged =
      existing.trimEnd() +
      `\n\n# Added by gitkit (${normalized})\n` +
      newLines.join('\n') +
      '\n';

    fs.writeFileSync(gitignorePath, merged, 'utf8');
    console.log(chalk.green(`Merged ${normalized} template into existing .gitignore (${newLines.length} new lines added)`));
  } else {
    fs.writeFileSync(gitignorePath, templateContent, 'utf8');
    console.log(chalk.green(`Created .gitignore with ${normalized} template`));
  }
}

module.exports = { runIgnoreList, runIgnoreAdd };
