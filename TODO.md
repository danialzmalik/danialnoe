# Website Modernization TODO

## ✅ Completed (2025-11-28)

### Phase 1: Foundation & Architecture
- [x] Decided on Astro + Tailwind v4 + React islands architecture
- [x] Set up pnpm monorepo with workspaces (site/, apps/*, games/*)
- [x] Fixed original site CSS issues (malformed universal selector)
- [x] Added navigation to all original HTML pages
- [x] Created comprehensive README.md with architecture docs

### Phase 2: Astro Site Setup
- [x] Initialized Astro project in site/ directory
- [x] Integrated @astrojs/react for islands
- [x] Configured Tailwind v4 via @tailwindcss/vite
- [x] Created BaseLayout.astro with navigation and dark theme
- [x] Preserved CNAME (danialnoe.com) in site/public/

### Phase 3: Page Migration
- [x] Ported index.html → site/src/pages/index.astro
- [x] Ported rituals.html → site/src/pages/rituals.astro
- [x] Ported journal.html → site/src/pages/journal.astro
- [x] Fixed styling issues (background colors, padding from borders)
## 🚧 In Progress

- [] Make styling work with tailwind rather than inline styling

### Phase 4: Pomodoro Timer Migration
**Status:** Not started
**Complexity:** High (592 lines of vanilla JS)

**Current file:** pomodoro.html (root directory)
**Target:** site/src/components/Pomodoro.tsx + site/src/pages/pomodoro.astro

**Key features to preserve:**
1. Timer modes (Pomodoro 25min, Short Break 5min, Long Break 15min)
2. localStorage persistence:
   - Timer settings (durations)
   - Task list (6 tasks with checkboxes)
   - Statistics (pomodoro count, total minutes)
3. Drag-and-drop task reordering
4. Task highlighting (first unchecked task)
5. Settings modal for duration customization
6. "End Early" button with time tracking
7. Browser notifications
8. Auto-switch between modes
9. Stats reset functionality

**Implementation approach:**
1. Create site/src/components/Pomodoro.tsx as React component
2. Use React hooks for state management (useState, useEffect, useRef)
3. Preserve all localStorage keys for backward compatibility
4. Keep same UI/UX with Tailwind classes instead of custom CSS
5. Create site/src/pages/pomodoro.astro that imports the island with client:load
6. Test localStorage persistence across page reloads

**Files to reference:**
- pomodoro.html (lines 115-589 contain the JavaScript)
- styles.css (lines 79-489 contain Pomodoro-specific styles)

## 📋 Pending Tasks

### Phase 5: Journal Content System
**Priority:** Medium
**Estimated effort:** 2-3 hours

**Tasks:**
1. Create site/src/content/config.ts for content collections
2. Define journal schema (title, date, content)
3. Convert journal/*.html files to Markdown in site/src/content/journal/
4. Create site/src/pages/journal/[slug].astro for individual entries
5. Update site/src/pages/journal.astro to list all entries
6. Add date formatting and sorting

**Files to migrate:**
- journal/251121.html
- journal/251122.html
- journal/251123.html
- journal/251124.html
- journal/251125.html
- journal/251126.html

### Phase 6: Performance & SEO
**Priority:** High
**Estimated effort:** 1-2 hours

**Tasks:**
1. Run Lighthouse audit on all pages
2. Add SEO meta tags to BaseLayout.astro:
   - Open Graph tags
   - Twitter Card tags
   - Canonical URLs
3. Optimize font loading (preload system fonts or use font-display: swap)
4. Ensure Pomodoro island uses client:load or client:visible appropriately
5. Add sitemap.xml generation
6. Test Core Web Vitals

### Phase 7: GitHub Pages Deployment
**Priority:** High
**Estimated effort:** 2-3 hours

**Tasks:**
1. Create .github/workflows/deploy.yml
2. Configure workflow to:
   - Install pnpm
   - Install dependencies (pnpm install)
   - Build site (pnpm --filter site build)
   - Build all apps (when they exist)
   - Build all games (when they exist)
   - Copy built apps to site/dist/apps/
   - Copy built games to site/dist/games/
   - Deploy site/dist/ to gh-pages branch
3. Configure Astro for GitHub Pages:
   - Set site in astro.config.mjs
   - Set base if needed
4. Test deployment
5. Verify CNAME is preserved

**Reference:**
- Astro docs: https://docs.astro.build/en/guides/deploy/github/

### Phase 8: Sample App
**Priority:** Low
**Estimated effort:** 1-2 hours

**Tasks:**
1. Create apps/sample-app/ directory
2. Initialize Vite + React + TypeScript: `pnpm create vite sample-app --template react-ts`
3. Add Tailwind v4: `pnpm add -D tailwindcss@next @tailwindcss/vite@next`
4. Create simple demo app (e.g., calculator, todo list, or color picker)
5. Configure build output to apps/sample-app/dist
6. Add link from site/src/pages/index.astro
7. Update deployment workflow to include app build

### Phase 9: Sample Game
**Priority:** Low
**Estimated effort:** 2-3 hours

**Tasks:**
1. Create games/sample-game/ directory
2. Choose framework:
   - Option A: Phaser 3 (full game engine)
   - Option B: Vanilla canvas/WebGL (lighter)
3. Initialize with Vite: `pnpm create vite sample-game --template vanilla-ts`
4. Add game framework if using Phaser: `pnpm add phaser`
5. Create simple game (e.g., snake, pong, or flappy bird clone)
6. Configure build output to games/sample-game/dist
7. Add link from site/src/pages/index.astro
8. Update deployment workflow to include game build

### Phase 10: Documentation Updates
**Priority:** Medium
**Estimated effort:** 30 minutes

**Tasks:**
1. Update README.md with:
   - Final deployment instructions
   - How to add new apps (step-by-step)
   - How to add new games (step-by-step)
   - Local development workflow
   - Troubleshooting section
2. Add CONTRIBUTING.md if planning to open source
3. Update package.json descriptions

## 🎯 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start dev server (main site)
pnpm dev

# Build everything
pnpm build:all

# Preview production build
pnpm preview

# Clean all builds
pnpm clean
```

## 📝 Notes

### Current Site Structure
```
danialnoe/
├── site/                    # Astro hub (NEW)
│   ├── src/
│   │   ├── layouts/
│   │   │   └── BaseLayout.astro
│   │   ├── pages/
│   │   │   ├── index.astro
│   │   │   ├── rituals.astro
│   │   │   └── journal.astro
│   │   └── styles/
│   │       └── global.css
│   └── public/
│       └── CNAME
├── apps/                    # Future standalone apps
├── games/                   # Future standalone games
├── index.html              # OLD (keep for reference)
├── pomodoro.html           # OLD (migrate next)
├── rituals.html            # OLD (keep for reference)
├── journal.html            # OLD (keep for reference)
├── styles.css              # OLD (keep for reference)
└── journal/                # OLD (migrate to Markdown)
```

### Important Considerations

1. **Backward Compatibility:** The Pomodoro timer must maintain localStorage compatibility so users don't lose their tasks and stats.

2. **Performance:** Astro ships zero JS by default. Only the Pomodoro island should load JavaScript. Keep this in mind for future apps.

3. **Deployment:** GitHub Pages serves from root or /docs. We're using root with the gh-pages branch approach.

4. **Domain:** danialnoe.com is configured via CNAME. Ensure it's always in site/public/CNAME.

5. **Monorepo Benefits:** Each app/game can have its own dependencies and build process. They're sandboxed from each other.

### Testing Checklist Before Deployment

- [ ] All pages load correctly
- [ ] Navigation works on all pages
- [ ] Pomodoro timer functions match original
- [ ] localStorage persists across reloads
- [ ] Responsive design works on mobile
- [ ] Dark theme is consistent
- [ ] No console errors
- [ ] Lighthouse score > 90 on all metrics
- [ ] CNAME file is in build output

## 🔗 Useful Links

- Astro Docs: https://docs.astro.build
- Tailwind v4 Docs: https://tailwindcss.com/docs
- React Docs: https://react.dev
- pnpm Workspaces: https://pnpm.io/workspaces
- GitHub Pages: https://pages.github.com

## 📅 Timeline Estimate

- **Pomodoro Migration:** 3-4 hours
- **Journal System:** 2-3 hours
- **Performance & SEO:** 1-2 hours
- **Deployment Setup:** 2-3 hours
- **Sample App:** 1-2 hours
- **Sample Game:** 2-3 hours
- **Documentation:** 30 minutes

**Total:** ~12-18 hours of focused work

## 🎉 Success Criteria

1. Site loads fast (Lighthouse > 90)
2. All original features preserved
3. Easy to add new apps/games
4. Deployed to danialnoe.com
5. Documented for future maintenance