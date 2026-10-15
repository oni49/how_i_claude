import { promises as fs } from "fs";
import * as path from "path";

export interface ScanOptions {
  /** Directory names never descended into. */
  ignore: string[];
  /** How many directory levels below the root to search. */
  maxDepth: number;
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  ignore: ["node_modules", ".obsidian", ".trash", ".git"],
  maxDepth: 8,
};

/**
 * Find git repos under `root`, returning absolute paths.
 *
 * - `root` itself is never reported, even if it is a repo (the vault's own repo is excluded).
 * - A directory containing `.git` (a directory, or a file for worktrees/submodules) is a repo,
 *   and the walk does not descend into it, so nested repos are excluded.
 * - Symlinks are not followed.
 */
export async function findRepos(
  root: string,
  options: ScanOptions = DEFAULT_SCAN_OPTIONS
): Promise<string[]> {
  const repos: string[] = [];
  const ignore = new Set(options.ignore);

  async function walk(dir: string, depth: number): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directory: skip
    }

    if (dir !== root && entries.some((e) => e.name === ".git")) {
      repos.push(dir);
      return;
    }

    if (depth >= options.maxDepth) return;

    const subdirs = entries.filter((e) => e.isDirectory() && !ignore.has(e.name));
    await Promise.all(subdirs.map((e) => walk(path.join(dir, e.name), depth + 1)));
  }

  await walk(root, 0);
  return repos.sort((a, b) => a.localeCompare(b));
}
