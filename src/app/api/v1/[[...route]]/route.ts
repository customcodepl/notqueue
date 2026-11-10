import { handle } from "hono/vercel";

import { api } from "@/server/api";

// Every method goes to Hono, so unsupported ones get a problem+json 404
// instead of Next.js's empty 405. Node.js runtime: pg needs it.
const handler = handle(api);

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
