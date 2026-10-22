import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

// Removes PII from Sentry events before they leave the process (CLAUDE.md: no
// PII in Sentry). A second line of defence behind the SDK's dataCollection
// settings; pure, with type-only SDK imports.

// Breadcrumb data keys that hold URLs (navigation, fetch, xhr).
const URL_KEYS = ["url", "from", "to"] as const;

/** Drops the query string and fragment, which may carry tokens or contact data. */
export function stripUrl(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb.data) return breadcrumb;

  const data = { ...breadcrumb.data };
  for (const key of URL_KEYS) {
    const value: unknown = data[key];
    if (typeof value === "string") data[key] = stripUrl(value);
  }
  return { ...breadcrumb, data };
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed: ErrorEvent = { ...event };
  delete scrubbed.user;

  if (event.request) {
    // Only the URL without its query survives; headers, cookies and bodies
    // can all contain personal data.
    scrubbed.request = event.request.url
      ? { url: stripUrl(event.request.url) }
      : {};
  }

  if (event.breadcrumbs) {
    scrubbed.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  }

  return scrubbed;
}
