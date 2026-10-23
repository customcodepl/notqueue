import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent, stripUrl } from "./scrub";

describe("stripUrl", () => {
  it("drops the query string and fragment", () => {
    expect(stripUrl("https://app.test/q/abc?phone=123#x")).toBe(
      "https://app.test/q/abc",
    );
    expect(stripUrl("/status#token")).toBe("/status");
  });

  it("keeps a URL without query or fragment", () => {
    expect(stripUrl("https://app.test/")).toBe("https://app.test/");
  });
});

describe("scrubEvent", () => {
  const event: ErrorEvent = {
    type: undefined,
    message: "boom",
    exception: {
      values: [{ type: "Error", stacktrace: { frames: [{ lineno: 1 }] } }],
    },
    user: { id: "u1", email: "jan@example.com", ip_address: "10.0.0.1" },
    request: {
      url: "https://app.test/join?email=jan%40example.com",
      query_string: "email=jan%40example.com",
      cookies: { session: "secret" },
      headers: { authorization: "Bearer secret", cookie: "session=secret" },
      data: { phone: "+48123456789" },
      env: { REMOTE_ADDR: "10.0.0.1" },
    },
    breadcrumbs: [
      {
        category: "fetch",
        data: { url: "/api/v1/x?token=abc", method: "GET" },
      },
      { category: "navigation", data: { from: "/a?x=1", to: "/b#t" } },
      { category: "console", message: "log line" },
    ],
  };

  it("removes the user and everything but the stripped request URL", () => {
    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request).toEqual({ url: "https://app.test/join" });
  });

  it("strips URLs in breadcrumbs and keeps other fields", () => {
    const scrubbed = scrubEvent(event);

    expect(scrubbed.breadcrumbs).toEqual([
      { category: "fetch", data: { url: "/api/v1/x", method: "GET" } },
      { category: "navigation", data: { from: "/a", to: "/b" } },
      { category: "console", message: "log line" },
    ]);
  });

  it("keeps the message and stack trace", () => {
    const scrubbed = scrubEvent(event);

    expect(scrubbed.message).toBe("boom");
    expect(scrubbed.exception).toEqual(event.exception);
  });

  it("does not mutate the original event", () => {
    const copy = structuredClone(event);
    scrubEvent(event);

    expect(event).toEqual(copy);
  });

  it("leaves an event without request or breadcrumbs as is", () => {
    const minimal: ErrorEvent = { type: undefined, message: "x" };

    expect(scrubEvent(minimal)).toEqual(minimal);
  });
});

describe("scrubBreadcrumb", () => {
  it("ignores non-string URL fields", () => {
    const crumb = { data: { url: 42, status_code: 500 } };

    expect(scrubBreadcrumb(crumb)).toEqual(crumb);
  });
});
