# gitkit — Hoja de la Verdad

## ¿Qué es?

`gitkit` es una herramienta de línea de comandos global para Node.js que simplifica los flujos de trabajo más comunes con Git: la configuración inicial de un repositorio y el push diario de cambios.

Funciona con cualquier tipo de proyecto web (Laravel, Node.js, Python, o cualquier otro).

## ¿Por qué existe?

Inicializar un repositorio correctamente implica 6-8 comandos de Git que se repiten siempre igual:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <url>
git branch -M main
git push -u origin main
```

`gitkit init` reemplaza todo eso con un único flujo interactivo guiado. Además añade el `.gitignore` correcto antes del primer commit, que es exactamente cuando más falta hace.

## ¿En qué consiste?

### Comandos

| Comando | Qué hace |
|---|---|
| `gitkit clone <url>` | Clona repo + detecta package manager + instala dependencias |
| `gitkit init` | Flujo completo: git init + .gitignore + primer commit + push a GitHub |
| `gitkit sync [mensaje]` | Ciclo completo: pull + add + commit + push en un solo paso |
| `gitkit push [mensaje]` | Push rápido: add + commit + push en un solo paso |
| `gitkit status` | Dashboard visual del estado del repo |
| `gitkit log [-n N] [--all]` | Historial compacto y coloreado |
| `gitkit branch [nombre]` | Listar, crear o eliminar ramas locales |
| `gitkit undo [--hard]` | Deshacer último commit (soft por defecto) |
| `gitkit ignore list` | Muestra los templates disponibles |
| `gitkit ignore add <template>` | Aplica un template al proyecto (merge sin duplicados) |

### Templates de `.gitignore`

| Template | Cubre |
|---|---|
| `laravel` | Laravel, Composer, npm |
| `node` | Node.js, npm / yarn / pnpm |
| `python` | Python, virtualenv, pytest, mypy |
| `full` | Todo lo anterior + patrones comunes de OS e IDEs |

### UX

- Cada operación Git muestra un spinner mientras se ejecuta
- Verde = éxito, rojo = error, amarillo = advertencia
- Los errores muestran mensajes legibles — sin stack traces crudos
- Todos los comandos operan en `process.cwd()` (igual que Git nativo) con soporte de `--path <dir>` para sobrescribir el directorio

## Instalación global

```bash
# pnpm (recomendado)
pnpm add -g @edgarqs/gitkit

# npm (alternativa)
npm install -g @edgarqs/gitkit
```

### Desde código fuente

```bash
git clone https://github.com/edgarqs/gitkit
cd gitkit

pnpm install
pnpm add -g .
```

## Distribución

| Canal | URL |
|---|---|
| npm / pnpm registry | https://www.npmjs.com/package/@edgarqs/gitkit |
| Código fuente | https://github.com/edgarqs/gitkit |
| Licencia | MIT |

Publicado como paquete público con scope `@edgarqs`. Cualquier usuario instala sin clonar el repo:

```bash
pnpm add -g @edgarqs/gitkit
```

## Stack

- **commander** — parsing de comandos y flags
- **inquirer** — prompts interactivos
- **chalk** — colores en terminal
- **ora** — spinners de carga
- **simple-git** — wrapper de comandos Git
