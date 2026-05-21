# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Install & Setup

```bash
# pnpm (recommended)
pnpm install
pnpm add -g .      # global install — exposes `gitkit` CLI

# npm (alternative)
npm install
npm install -g .
```

After any change to `bin/gitkit.js` or `src/**`, the globally installed binary picks up changes immediately (symlinked by the package manager).

## Running

```bash
# Run without global install
node bin/gitkit.js <command>

# After global install
gitkit init
gitkit push "message"
gitkit ignore list
gitkit ignore add <template>
```

## Architecture

**Entry point:** `bin/gitkit.js` — registers all commands via `commander`, lazily `require()`s command modules so startup is fast.

**Command modules** (`src/commands/`):
- `init.js` — full repo setup flow (git init → .gitignore → commit → remote → push)
- `push.js` — quick add/commit/push
- `ignore.js` — list and merge `.gitignore` templates

**Templates** (`src/templates/`): static `.gitignore` files consumed by both `init.js` (writes fresh file) and `ignore.js add` (merges into existing, deduplicates by line).

**Key pattern:** every git operation goes through a local `runStep(label, fn)` helper that wraps an `ora` spinner, catches errors, prints a human-readable message, and calls `process.exit(1)` on failure — no raw stack traces reach the user.

## Dependency notes

Pinned to CommonJS-compatible major versions — do not upgrade without checking ESM compatibility:
- `chalk` ^4 (chalk 5+ is ESM-only)
- `ora` ^5 (ora 6+ is ESM-only)
- `inquirer` ^8 (inquirer 9+ is ESM-only)

`simple-git` and `commander` are version-agnostic.

## Working directory behavior

Every command resolves its target directory as `process.cwd()` unless `--path <dir>` is passed. The resolved path is validated (`fs.existsSync` + `isDirectory()`) before any git operation runs.
