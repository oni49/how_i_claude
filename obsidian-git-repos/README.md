# Git Repos Overview

An Obsidian plugin that shows the git repos inside your vault in a sidebar view: each repo's local branches, with the checked-out branch highlighted.

- Desktop only (it runs `git`).
- The vault's own repo and repos nested inside other repos are not listed.
- Scans when the plugin loads; use the refresh button in the view header to rescan.

See [PLAN.md](PLAN.md) for the design.

## Build

```
npm install
npm run build
```

Copy `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/git-repos-overview/` and enable the plugin.
