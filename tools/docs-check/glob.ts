/**
 * Matches repo-relative paths against a glob: `**` spans folders, `*` stays
 * within one segment. Enough for the doc map and the living-docs list.
 */
export function globToRegExp(glob: string): RegExp {
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob.charAt(i);
    if (char === "*" && glob[i + 1] === "*") {
      // `**/` also matches zero folders.
      if (glob[i + 2] === "/") {
        pattern += "(?:.*/)?";
        i += 2;
      } else {
        pattern += ".*";
        i += 1;
      }
    } else if (char === "*") {
      pattern += "[^/]*";
    } else {
      pattern += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${pattern}$`);
}

export function matchesAny(file: string, globs: string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(file));
}
