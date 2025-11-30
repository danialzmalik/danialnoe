# Danial Noe - Personal Website Hub

A fast, modern personal website built with Astro + Tailwind v4, featuring interactive React islands and a scalable architecture for hosting multiple apps and games.

## 🏗️ Architecture

```
danialnoe/
├── site/              # Astro hub (main website)
│   ├── src/
│   │   ├── pages/     # Routes (index, pomodoro, rituals, journal)
│   │   ├── components/ # React islands for interactive widgets
│   │   ├── layouts/   # Shared layouts
│   │   └── content/   # Markdown content (journal entries)
│   └── public/        # Static assets
├── apps/              # Standalone Vite + React apps
│   └── sample-app/    # Example app
└── games/             # Standalone game projects
    └── sample-game/   # Example game
```

### Why This Stack?

- **Astro**: Near-zero JS by default, perfect for fast page loads
- **React Islands**: Interactive components only load JS where needed
- **Tailwind v4**: Modern utility-first CSS with improved performance
- **TypeScript**: Type safety across all projects
- **pnpm Workspaces**: Efficient monorepo management
- **GitHub Pages**: Free, fast static hosting

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Start the main site in dev mode
pnpm dev

# Build all projects
pnpm build:all

# Preview production build
pnpm preview
```

## 📦 Project Structure

### Main Site (`site/`)

The Astro hub serves as the entry point and hosts:
- Homepage with links to apps/games
- Pomodoro timer (React island)
- Rituals page
- Journal with Markdown entries

### Apps (`apps/`)

Standalone Vite + React + TypeScript applications. Each app:
- Has its own dependencies and build process
- Builds to `apps/[app-name]/dist`
- Gets copied to `site/dist/apps/[app-name]` during deployment
- Is accessible at `/apps/[app-name]/`

### Games (`games/`)

Standalone game projects (Vite + Phaser, canvas, WebGL, etc.). Each game:
- Has its own dependencies and build process
- Builds to `games/[game-name]/dist`
- Gets copied to `site/dist/games/[game-name]` during deployment
- Is accessible at `/games/[game-name]/`

## 🎯 Adding New Projects

### Adding a New App

```bash
# Create new Vite + React + TypeScript app
cd apps
pnpm create vite my-app --template react-ts
cd my-app
pnpm install

# Add Tailwind v4 if needed
pnpm add -D tailwindcss@next @tailwindcss/vite@next
```

Then link it from the main site by adding a link in `site/src/pages/index.astro`.

### Adding a New Game

```bash
# Create new Vite project
cd games
pnpm create vite my-game --template vanilla-ts
cd my-game
pnpm install

# Add game framework (e.g., Phaser)
pnpm add phaser
```

Then link it from the main site.

## 🚢 Deployment

The site deploys to GitHub Pages via GitHub Actions:

1. Builds the main Astro site
2. Builds all apps and games
3. Copies built apps to `site/dist/apps/`
4. Copies built games to `site/dist/games/`
5. Deploys `site/dist/` to GitHub Pages

### Manual Deployment

```bash
# Build everything
pnpm build:all

# The site/dist folder is ready to deploy
```

## 🛠️ Available Scripts

```bash
pnpm dev              # Start main site in dev mode
pnpm build            # Build main site only
pnpm build:all        # Build all projects (site + apps + games)
pnpm preview          # Preview production build
pnpm clean            # Clean all dist and node_modules
```

## 📝 Content Management

### Journal Entries

Journal entries are Markdown files in `site/src/content/journal/`:

```markdown
---
title: "Entry Title"
date: 2025-11-28
---

Your journal content here...
```

### Adding Pages

Create new `.astro` files in `site/src/pages/` for new routes.

## 🎨 Styling

- Main site uses Tailwind v4 with a dark theme
- Apps and games can use their own styling approach
- Shared design tokens can be defined in Tailwind config

## 📊 Performance

- Lighthouse score target: 95+ on all metrics
- Main site ships minimal JS (only for interactive islands)
- Apps/games load their JS only when visited
- Images optimized via Astro's built-in optimization

## 🔧 Tech Stack

- **Framework**: Astro 4.x
- **UI Library**: React 18.x (islands only)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 5.x
- **Package Manager**: pnpm 8.x
- **Hosting**: GitHub Pages

## 📄 License

MIT

## 🤝 Contributing

This is a personal project, but feel free to fork and adapt for your own use!