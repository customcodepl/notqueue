import type { BuildInfo } from "@/api/routes/health";

/** Which deployment answers: Vercel system env, with local defaults. */
export function buildInfo(env: Record<string, string | undefined>): BuildInfo {
  return {
    version: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    region: env.VERCEL_REGION || "local",
  };
}
