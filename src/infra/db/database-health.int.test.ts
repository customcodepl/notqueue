import { createServer, type Server, type Socket } from "node:net";

import { afterAll, describe, expect, it } from "vitest";

import { createDb } from "./client";
import { drizzleDatabaseHealth } from "./database-health";
import { createTestDb } from "./testing";

const { db, close } = createTestDb();
afterAll(close);

/** A TCP server that accepts connections and never answers. */
async function silentServer(): Promise<{ url: string; stop: () => void }> {
  const sockets = new Set<Socket>();
  const server: Server = createServer((socket) => sockets.add(socket));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a TCP address");
  }
  return {
    url: `postgresql://postgres:postgres@127.0.0.1:${address.port}/postgres`,
    stop: () => {
      for (const socket of sockets) socket.destroy();
      server.close();
    },
  };
}

describe("drizzleDatabaseHealth", () => {
  it("answers on the local database", async () => {
    await expect(drizzleDatabaseHealth(() => db).ping()).resolves.toBe(
      undefined,
    );
  });

  it("fails within the timeout when the database doesn't answer", async () => {
    const silent = await silentServer();
    const { db: hanging, pool } = createDb(silent.url, 1);
    const started = performance.now();
    await expect(
      drizzleDatabaseHealth(() => hanging, 200).ping(),
    ).rejects.toThrow("did not answer within 200 ms");
    expect(performance.now() - started).toBeLessThan(1_000);
    silent.stop();
    await pool.end();
  });

  it("fails when the database refuses connections", async () => {
    const silent = await silentServer();
    silent.stop();
    const { db: refused, pool } = createDb(silent.url, 1);
    await expect(drizzleDatabaseHealth(() => refused).ping()).rejects.toThrow();
    await pool.end();
  });

  it("fails when the database can't be created", async () => {
    const health = drizzleDatabaseHealth(() => {
      throw new Error("DATABASE_URL is not set");
    });
    await expect(health.ping()).rejects.toThrow("DATABASE_URL is not set");
  });
});
