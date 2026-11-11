// A minimal Markdown reader for the checks: headings, links and inline code,
// with fenced code blocks skipped. Not a full CommonMark parser.

export interface Heading {
  text: string;
  slug: string;
  line: number;
}

export interface Link {
  target: string;
  line: number;
}

export interface CodeSpan {
  text: string;
  line: number;
}

export interface MarkdownDoc {
  headings: Heading[];
  links: Link[];
  codeSpans: CodeSpan[];
}

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^#{1,6}\s+(.+?)\s*#*\s*$/;
const CODE_SPAN = /`([^`]+)`/g;
const LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/** GitHub's anchor for a heading text, before de-duplication. */
export function githubSlug(heading: string): string {
  return heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

export function parseMarkdown(text: string): MarkdownDoc {
  const doc: MarkdownDoc = { headings: [], links: [], codeSpans: [] };
  const seen = new Map<string, number>();
  let inFence = false;

  text.split("\n").forEach((raw, index) => {
    const line = index + 1;
    if (FENCE.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const heading = HEADING.exec(raw);
    if (heading?.[1]) {
      const base = githubSlug(heading[1]);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      doc.headings.push({
        text: heading[1],
        slug: count === 0 ? base : `${base}-${count}`,
        line,
      });
    }

    for (const match of raw.matchAll(CODE_SPAN)) {
      if (match[1]) doc.codeSpans.push({ text: match[1], line });
    }
    // Links inside inline code are text, not links.
    const withoutCode = raw.replace(CODE_SPAN, (span) =>
      " ".repeat(span.length),
    );
    for (const match of withoutCode.matchAll(LINK)) {
      if (match[1]) doc.links.push({ target: match[1], line });
    }
  });

  return doc;
}
