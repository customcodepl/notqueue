import type { Db } from "../client";
import { organizations } from "../schema";
import type { Tx } from "../transaction";

/** Inserts an organization as the owner and returns its ID. */
export async function insertOrganization(
  executor: Db | Tx,
  name = "Test organization",
): Promise<string> {
  const [row] = await executor
    .insert(organizations)
    .values({ name })
    .returning({ id: organizations.id });
  return row!.id;
}
