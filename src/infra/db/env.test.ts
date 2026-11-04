import { describe, expect, it } from "vitest";

import { LOCAL_DATABASE_URL, readDatabaseUrl, readPoolMax } from "./env";

const SECRET_URL = "postgresql://user:s3cret@db.example.com:6543/postgres";

describe("readDatabaseUrl", () => {
  it("returns a valid URL", () => {
    expect(readDatabaseUrl("DATABASE_URL", { DATABASE_URL: SECRET_URL })).toBe(
      SECRET_URL,
    );
  });

  it("names the variable when it is missing", () => {
    expect(() => readDatabaseUrl("DATABASE_URL", {})).toThrow(
      "DATABASE_URL is not set",
    );
  });

  it("rejects a malformed URL without printing it", () => {
    const malformed = "mysql://user:s3cret@db.example.com/app";
    expect(() =>
      readDatabaseUrl("DATABASE_URL", { DATABASE_URL: malformed }),
    ).toThrow(/^DATABASE_URL is not a valid/);
    try {
      readDatabaseUrl("DATABASE_URL", { DATABASE_URL: malformed });
    } catch (error) {
      expect(String(error)).not.toContain("s3cret");
    }
  });

  it("falls back to the local stack only when asked and outside CI", () => {
    const options = { localFallback: true };
    expect(readDatabaseUrl("MIGRATIONS_DATABASE_URL", {}, options)).toBe(
      LOCAL_DATABASE_URL,
    );
    expect(() =>
      readDatabaseUrl("MIGRATIONS_DATABASE_URL", { CI: "true" }, options),
    ).toThrow("MIGRATIONS_DATABASE_URL is not set");
  });
});

describe("readPoolMax", () => {
  it("defaults to 5", () => {
    expect(readPoolMax({})).toBe(5);
  });

  it("parses a configured value", () => {
    expect(readPoolMax({ DATABASE_POOL_MAX: "3" })).toBe(3);
  });

  it.each(["0", "51", "2.5", "many"])("rejects %s", (value) => {
    expect(() => readPoolMax({ DATABASE_POOL_MAX: value })).toThrow(
      "DATABASE_POOL_MAX must be an integer between 1 and 50.",
    );
  });
});
