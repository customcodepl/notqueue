import { describe, expect, it } from "vitest";

import { poolConfig } from "./client";
import { SUPABASE_ROOT_CA } from "./supabase-ca";

const POOLER =
  "postgresql://postgres.ref:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

describe("poolConfig", () => {
  it.each([
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    "postgresql://postgres:postgres@localhost:54322/postgres",
  ])("connects to the local stack without TLS: %s", (url) => {
    const config = poolConfig(url, 2);
    expect(config.ssl).toBeUndefined();
    expect(config.connectionString).toBe(url);
  });

  it("requires TLS verified against the Supabase root CA for remote hosts", () => {
    const config = poolConfig(POOLER, 5);
    expect(config.ssl).toEqual({
      ca: SUPABASE_ROOT_CA,
      rejectUnauthorized: true,
    });
    expect(config.max).toBe(5);
  });

  it("drops URL SSL parameters that would override the pinned CA", () => {
    const config = poolConfig(
      `${POOLER}?sslmode=require&sslrootcert=/tmp/ca.crt&application_name=notqueue`,
      5,
    );
    const url = new URL(config.connectionString!);
    expect(url.searchParams.has("sslmode")).toBe(false);
    expect(url.searchParams.has("sslrootcert")).toBe(false);
    expect(url.searchParams.get("application_name")).toBe("notqueue");
  });

  it("pins a PEM certificate", () => {
    expect(SUPABASE_ROOT_CA).toMatch(
      /^-----BEGIN CERTIFICATE-----\n[A-Za-z0-9+/=\n]+\n-----END CERTIFICATE-----$/,
    );
  });
});
