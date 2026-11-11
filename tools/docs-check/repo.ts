import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** What the checks see of the repository; tests pass an in-memory one. */
export interface Repo {
  /** Tracked and new (not ignored) files, repo-relative with `/`. */
  files: string[];
  read(file: string): string;
  exists(file: string): boolean;
}

export interface Finding {
  file: string;
  line: number;
  message: string;
}

/** Markdown files the checks read; fixtures are deliberately broken. */
export function markdownFiles(repo: Repo): string[] {
  return repo.files.filter(
    (file) =>
      file.endsWith(".md") && !file.startsWith("tools/depcruise-fixtures/"),
  );
}

export function gitRepo(root: string): Repo {
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter((file) => file && existsSync(path.join(root, file)));
  return {
    files,
    read: (file) => readFileSync(path.join(root, file), "utf8"),
    exists: (file) => existsSync(path.join(root, file)),
  };
}

/** For tests: files given as `{ path: content }`; folders exist implicitly. */
export function memoryRepo(contents: Record<string, string>): Repo {
  const files = Object.keys(contents);
  return {
    files,
    read: (file) => {
      const content = contents[file];
      if (content === undefined) throw new Error(`No file ${file}`);
      return content;
    },
    exists: (file) =>
      file in contents || files.some((f) => f.startsWith(`${file}/`)),
  };
}
