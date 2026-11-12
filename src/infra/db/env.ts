import { z } from "zod";

// Database URLs are read and validated only here (ADR-0013). Error messages
// name the variable but never print its value: it holds the password.

const postgresUrl = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  });

/** The local Supabase stack (`pnpm db:start`), used when nothing is configured locally. */
export const LOCAL_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * The runtime role on the local stack (ADR-0022). Its password is a fixed
 * local value set by `pnpm db:migrate`; hosted projects get a real one.
 */
export const LOCAL_API_ROLE_PASSWORD = "notqueue_api";
export const LOCAL_API_DATABASE_URL = `postgresql://notqueue_api:${LOCAL_API_ROLE_PASSWORD}@127.0.0.1:54322/postgres`;

type Env = Record<string, string | undefined>;

export function readDatabaseUrl(
  name: "DATABASE_URL" | "MIGRATIONS_DATABASE_URL",
  env: Env = process.env,
  options: { localFallback?: boolean } = {},
): string {
  const value =
    env[name] ||
    (options.localFallback && !env.CI ? LOCAL_DATABASE_URL : undefined);
  if (value === undefined) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  if (!postgresUrl.safeParse(value).success) {
    throw new Error(`${name} is not a valid postgres:// or postgresql:// URL.`);
  }
  return value;
}

/** Pool size per function instance; pool size × instances must stay under the pooler's client limit. */
export function readPoolMax(env: Env = process.env): number {
  const raw = env.DATABASE_POOL_MAX;
  if (!raw) return 5;
  const parsed = z.coerce.number().int().min(1).max(50).safeParse(raw);
  if (!parsed.success) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 50.");
  }
  return parsed.data;
}
