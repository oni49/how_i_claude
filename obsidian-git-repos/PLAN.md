# Git Repos Overview: plan

An Obsidian plugin that summarizes the git repos inside the vault: each repo, its local branches, and which branch is checked out.

## Scope (v1)

- Desktop-only plugin (`isDesktopOnly: true`). It needs Node `fs` and `child_process`, so it can't run on mobile.
- A **sidebar view** (`ItemView`) shows a tree of repo → branches, with the checked-out branch highlighted and a refresh button in the view header.
- **Refresh** is manual (view button, "Refresh git repos" command) plus one scan when the plugin loads.

## How it works

### Discovery (`src/scanner.ts`)

- Walk the vault from `FileSystemAdapter.getBasePath()` with `fs.promises.readdir`. Obsidian's Vault API hides dot-folders, so it can't be used here.
- A directory containing `.git` (a folder, or a file for worktrees and submodules) is a repo.
- The vault's own repo is excluded: the root directory is never reported.
- Nested repos are excluded: the walk does not descend into a directory once it is identified as a repo.
- Skipped directories: `node_modules`, `.obsidian`, `.trash`, `.git`. Symlinks are not followed. Max depth is 8.

### Git data (`src/git.ts`)

- `execFile("git", ["-C", repo, ...])`, never `exec`, so odd folder names can't inject shell commands. 10 s timeout, `GIT_OPTIONAL_LOCKS=0`.
- Branches: `git branch --format=%(refname:short)`.
- Current branch: `git symbolic-ref --short -q HEAD`.
- Detached HEAD: fall back to `git rev-parse --short HEAD` and show "detached @ abc1234".
- A repo with no commits yet has a current branch but no branch refs, so the current branch is added to the list.
- A failing repo (for example git's `safe.directory` check) shows its error in the view and doesn't break the others.
- Repos are queried in parallel with a concurrency cap of 8.

### View (`src/view.ts`, `src/main.ts`)

- The plugin owns the scan state (`repos`, `scanning`, `lastScan`). The view only renders it.
- The scan on load runs inside `workspace.onLayoutReady` so it doesn't slow startup.
- Opening the view before any scan has run triggers one.

## Layout

```
obsidian-git-repos/
  manifest.json, package.json, tsconfig.json, esbuild.config.mjs
  styles.css
  src/main.ts      plugin lifecycle, scan orchestration
  src/scanner.ts   find repos on disk
  src/git.ts       query a repo with git
  src/view.ts      sidebar ItemView
```

## Build and install

```
npm install
npm run build        # type-checks, then bundles to main.js
```

The built `main.js` is committed so a vault can use the plugin straight from a `git pull`. See README.md for install steps. Rebuild and commit `main.js` with any source change.

## Later

Planned extras are tracked as GitHub issues, with the `git-repos-overview` label:

- Live updates when branches change
- Dirty/clean status and ahead/behind counts
- Remote URL, last commit date and stale-branch highlighting
- Click a repo to open its folder in the OS file manager
- Settings tab (scan depth, ignore patterns, git path, remote branches)
- Scheduled background refresh
