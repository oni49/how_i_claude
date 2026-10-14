import { execFile } from "child_process";

export interface RepoInfo {
  /** Absolute path of the repo. */
  path: string;
  /** Path relative to the vault root, used as the display name. */
  name: string;
  /** Checked-out branch, or null when HEAD is detached. */
  current: string | null;
  /** Short commit hash when HEAD is detached. */
  detachedAt?: string;
  /** Local branches, current branch first. */
  branches: string[];
  error?: string;
}

const GIT_TIMEOUT_MS = 10_000;

function git(repo: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["-C", repo, ...args],
      { timeout: GIT_TIMEOUT_MS, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } },
      (err, stdout, stderr) => {
        if (err) reject(new Error(stderr.trim() || err.message));
        else resolve(stdout.trim());
      }
    );
  });
}

export async function getRepoInfo(repo: string, name: string): Promise<RepoInfo> {
  try {
    const [branchOut, current] = await Promise.all([
      git(repo, ["branch", "--format=%(refname:short)"]),
      // -q: exit non-zero without noise when HEAD is detached
      git(repo, ["symbolic-ref", "--short", "-q", "HEAD"]).catch(() => null),
    ]);

    const branches = branchOut
      .split("\n")
      .map((b) => b.trim())
      // `git branch` lists "(HEAD detached at ...)" for a detached HEAD
      .filter((b) => b && !b.startsWith("("));

    // A fresh repo with no commits has a current branch but no branch refs yet.
    if (current && !branches.includes(current)) branches.push(current);

    branches.sort((a, b) => {
      if (a === current) return -1;
      if (b === current) return 1;
      return a.localeCompare(b);
    });

    let detachedAt: string | undefined;
    if (!current) {
      detachedAt = await git(repo, ["rev-parse", "--short", "HEAD"]).catch(() => undefined);
    }

    return { path: repo, name, current, detachedAt, branches };
  } catch (e) {
    return {
      path: repo,
      name,
      current: null,
      branches: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Run `fn` over `items` with at most `limit` in flight, preserving input order. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
