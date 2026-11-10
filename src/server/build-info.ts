import type { BuildInfo } from "@/api/routes/health";

/**
 * Which deployment answers. NOTQUEUE_COMMIT_SHA is inlined at build
 * (next.config.ts), VERCEL_REGION exists at runtime only.
 */
export function buildInfo(env: {
  NOTQUEUE_COMMIT_SHA?: string;
  VERCEL_REGION?: string;
}): BuildInfo {
  return {
    version: env.NOTQUEUE_COMMIT_SHA?.slice(0, 7) || "dev",
    region: env.VERCEL_REGION || "local",
  };
}
