import { ItemView, WorkspaceLeaf } from "obsidian";
import type GitReposPlugin from "./main";

export const VIEW_TYPE_GIT_REPOS = "git-repos-overview-view";

export class GitReposView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: GitReposPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_GIT_REPOS;
  }

  getDisplayText(): string {
    return "Git repos";
  }

  getIcon(): string {
    return "git-branch";
  }

  async onOpen(): Promise<void> {
    this.addAction("refresh-cw", "Refresh", () => void this.plugin.refresh());
    this.render();
    // Opened before the on-load scan has run (or it never ran): trigger one.
    if (!this.plugin.lastScan && !this.plugin.scanning) void this.plugin.refresh();
  }

  render(): void {
    const el = this.contentEl;
    el.empty();
    el.addClass("git-repos-view");

    const { repos, scanning, lastScan } = this.plugin;

    el.createDiv({
      cls: "git-repos-status",
      text: scanning
        ? "Scanning…"
        : lastScan
          ? `${repos.length} ${repos.length === 1 ? "repo" : "repos"} · scanned ${lastScan.toLocaleTimeString()}`
          : "Not scanned yet",
    });

    if (!scanning && lastScan && repos.length === 0) {
      el.createDiv({ cls: "git-repos-empty", text: "No git repos found in this vault." });
      return;
    }

    for (const repo of repos) {
      const details = el.createEl("details", { cls: "git-repos-repo" });
      details.open = true;

      const summary = details.createEl("summary");
      summary.createSpan({ cls: "git-repos-name", text: repo.name });
      if (repo.current) {
        summary.createSpan({ cls: "git-repos-current", text: repo.current });
      } else if (!repo.error) {
        summary.createSpan({
          cls: "git-repos-current",
          text: `detached${repo.detachedAt ? ` @ ${repo.detachedAt}` : ""}`,
        });
      }

      if (repo.error) {
        details.createDiv({ cls: "git-repos-error", text: repo.error });
        continue;
      }

      const list = details.createEl("ul", { cls: "git-repos-branches" });
      for (const branch of repo.branches) {
        list.createEl("li", {
          cls: branch === repo.current ? "git-repos-branch is-current" : "git-repos-branch",
          text: branch,
        });
      }
    }
  }
}
