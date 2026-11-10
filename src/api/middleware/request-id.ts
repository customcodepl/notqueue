import type { Context, MiddlewareHandler } from "hono";

export const REQUEST_ID_HEADER = "x-request-id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accepts a client `x-request-id` only if it's a UUID (no free text from
 * clients in logs or Sentry), otherwise generates one, and echoes it.
 */
export const requestId: MiddlewareHandler<{
  Variables: { requestId: string };
}> = async (c, next) => {
  const incoming = c.req.header(REQUEST_ID_HEADER);
  const id =
    incoming && UUID.test(incoming)
      ? incoming.toLowerCase()
      : crypto.randomUUID();
  c.set("requestId", id);
  c.header(REQUEST_ID_HEADER, id);
  await next();
};

/** The request's ID; responses outside the middleware get a fresh one. */
export function requestIdOf(c: Context): string {
  const id: unknown = c.get("requestId");
  return typeof id === "string" ? id : crypto.randomUUID();
}
