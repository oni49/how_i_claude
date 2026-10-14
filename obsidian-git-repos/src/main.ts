import { FileSystemAdapter, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import * as path from "path";
import { getRepoInfo, mapLimit, RepoInfo } from "./git";
import { findRepos } from "./scanner";
import { GitReposView, VIEW_TYPE_GIT_REPOS } from "./view";

const GIT_CONCURRENCY = 8;

export default class GitReposPlugin extends Plugin {
  repos: RepoInfo[] = [];
  scanning = false;
  lastScan: Date | null = null;

  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_GIT_REPOS, (leaf) => new GitReposView(leaf, this));

    this.addRibbonIcon("git-branch", "Open git repos", () => void this.activateView());
    this.addCommand({
      id: "open-git-repos-view",
      name: "Open git repos view",
      callback: () => void this.activateView(),
    });
    this.addCommand({
      id: "refresh-git-repos",
      name: "Refresh git repos",
      callback: () => void this.refresh(),
    });

    // Scan once on load, after the workspace is ready so startup isn't slowed.
    this.app.workspace.onLayoutReady(() => void this.refresh());
  }

  onunload(): void {
    // Registered views are detached by Obsidian on unload; nothing else to clean up in v1.
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE_GIT_REPOS)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_TYPE_GIT_REPOS, active: true });
    }
    await workspace.revealLeaf(leaf);
  }

  async refresh(): Promise<void> {
    if (this.scanning) return;

    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      new Notice("Git Repos Overview needs a desktop (filesystem) vault.");
      return;
    }
    const root = adapter.getBasePath();

    this.scanning = true;
    this.renderViews();
    try {
      const paths = await findRepos(root);
      this.repos = await mapLimit(paths, GIT_CONCURRENCY, (p) =>
        getRepoInfo(p, path.relative(root, p))
      );
      this.lastScan = new Date();
    } catch (e) {
      console.error("Git Repos Overview: scan failed", e);
      new Notice("Git Repos Overview: scan failed, see console.");
    } finally {
      this.scanning = false;
      this.renderViews();
    }
  }

  private renderViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_GIT_REPOS)) {
      if (leaf.view instanceof GitReposView) leaf.view.render();
    }
  }
}
