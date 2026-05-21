# gitkit

CLI tool that simplifies common Git workflows — initial repo setup and daily push operations. Works with any project type (Laravel, Node, Python, etc.).

## Install

```bash
# pnpm (recommended)
pnpm add -g @edgarqs/gitkit

# npm (alternative)
npm install -g @edgarqs/gitkit
```

### Install from source

```bash
git clone https://github.com/edgarqs/gitkit
cd gitkit

pnpm install
pnpm add -g .
```

## Commands

### `gitkit init`

Full initial repo setup flow. Run inside your project folder.

1. Confirms working directory
2. Selects a `.gitignore` template (Laravel, Node.js, Python, Full, or none)
3. Runs `git init`
4. Applies `.gitignore`
5. Runs `git add .`
6. Prompts for first commit message (default: `Initial commit`)
7. Runs `git commit`
8. Prompts for GitHub repo URL (HTTPS or SSH — auto-detected and validated)
9. Runs `git remote add origin`, `git branch -M main`, `git push -u origin main`

```bash
gitkit init
gitkit init --path /path/to/project
```

### `gitkit sync [message]`

Pull + add + commit + push in one step. Pulls remote changes first, then commits and pushes local changes. If there's nothing to commit after pulling, stops cleanly.

```bash
gitkit sync "update styles"
gitkit sync              # prompts for message interactively
gitkit sync --path /path/to/project "fix bug"
```

### `gitkit push [message]`

Quick daily push: `git add .` + `git commit -m` + `git push`.

```bash
gitkit push "fix login bug"
gitkit push              # prompts for message interactively
gitkit push --path /path/to/project "update deps"
```

### `gitkit ignore list`

Show available `.gitignore` templates.

```bash
gitkit ignore list
```

### `gitkit ignore add <template>`

Apply a template to the current project. Merges with an existing `.gitignore` — no duplicate lines added.

```bash
gitkit ignore add node
gitkit ignore add laravel
gitkit ignore add python
gitkit ignore add full
```

### `gitkit branch [name]`

Lista ramas locales con último commit y tiempo relativo. Crea y activa una rama en un paso. Elimina con confirmación.

```bash
gitkit branch                  # lista todas las ramas con info de último commit
gitkit branch feature/login    # crea rama + checkout
gitkit branch feature/login --push   # crea rama + checkout + push a origin
gitkit branch -d feature/login # elimina rama (pide confirmación)
```

**Lista de ramas:**
```
  * main              a1b2c3d  hace 23min      "fix login bug"
    feature/login     d4e5f6g  hace 2h         "add login form"
    hotfix/typo       g7h8i9j  hace 1d         "fix typo in header"
```

### `gitkit log`

Historial compacto y coloreado. Una línea por commit con hash, tiempo relativo, autor y mensaje.

```bash
gitkit log           # últimos 15 commits de la rama actual
gitkit log -n 30     # últimos 30 commits
gitkit log --all     # commits de todas las ramas
```

**Ejemplo de salida:**
```
  a1b2c3d  hace 23min    Edgar            "fix login bug"  ← HEAD
  d4e5f6g  hace 2h       Edgar            "add user model"
  g7h8i9j  hace 1d       Maria            "update styles"
```

### `gitkit status`

Dashboard visual del estado del repositorio. Muestra en un vistazo todo lo que `git status` fragmenta en texto plano.

```bash
gitkit status
gitkit status --path /ruta/proyecto
```

**Incluye:**
- Rama actual + cuántos commits llevas ↑ adelante / ↓ atrás de origin
- Último commit: mensaje, hash, tiempo relativo (hace 23min, hace 2h...)
- Archivos agrupados por categoría: **Staged** / **Unstaged** / **Untracked** / **Conflictos**
- Número de stashes guardados
- Sugerencia de acción según el estado actual

**Ejemplo de salida:**
```
  gitkit status
  ─────────────────────────────────────
  Branch:  main  ↑ 2 adelante de origin/main
  Último:  "fix login bug"  ·  hace 23min  ·  a1b2c3d

  Staged (2)          → incluidos en próximo commit
    M  src/auth.js
    A  src/utils.js

  Unstaged (1)        → no incluidos en próximo commit
    M  README.md

  Untracked (3)       → sin rastrear
    dist/
    .env.local
    notes.txt

  → Tienes cambios staged. Ejecuta: gitkit push "mensaje"
  ─────────────────────────────────────
```

### `gitkit undo`

Deshace el último commit. Por defecto modo **soft**: los cambios del commit vuelven al directorio de trabajo sin perderse.

```bash
gitkit undo               # deshace commit, conserva cambios
gitkit undo --hard        # deshace commit Y elimina los cambios (irreversible)
gitkit undo --path /ruta
```

**Soft (por defecto):**
```
commit A  ←  commit B   →   gitkit undo   →   commit A  +  cambios de B en tus archivos
```

**Hard (destructivo):**
```
commit A  ←  commit B   →   gitkit undo --hard   →   commit A  (cambios de B eliminados)
```

> `--hard` pide confirmación explícita escribiendo "yes" antes de ejecutar.

## Templates

| Template | Covers |
|----------|--------|
| `laravel` | Laravel, Composer, npm |
| `node` | Node.js, npm/yarn/pnpm |
| `python` | Python, venv, pytest, mypy |
| `full` | All of the above + common OS/IDE patterns |
