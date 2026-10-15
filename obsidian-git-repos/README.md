# Git Repos Overview

An Obsidian plugin that shows the git repos inside your vault in a sidebar view: each repo's local branches, with the checked-out branch highlighted.

- Desktop only (it runs `git`).
- The vault's own repo and repos nested inside other repos are not listed.
- Scans when the plugin loads; use the refresh button in the view header to rescan.

See [PLAN.md](PLAN.md) for the design.

## Install

The built `main.js` is committed, so no Node toolchain is needed in your vault.

In the vault's clone of this repo, link the plugin folder into Obsidian's plugin directory:

```
ln -s <path-to-clone>/obsidian-git-repos <vault>/.obsidian/plugins/git-repos-overview
```

Then enable **Git Repos Overview** under Settings → Community plugins. After a `git pull`, reload the plugin (or restart Obsidian) to pick up changes.

Or copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/git-repos-overview/` by hand.

## Build

Only needed when changing the source. **Rebuild and commit `main.js` with any source change**, since that is what the vault runs.

```
npm install
npm run build
```
