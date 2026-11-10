import type { MiddlewareHandler } from "hono";

/** No caching by default (ADR-0014); a cacheable endpoint opts in later. */
export const noStore: MiddlewareHandler = async (c, next) => {
  await next();
  c.res.headers.set("Cache-Control", "no-store");
};
