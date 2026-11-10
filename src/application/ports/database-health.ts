/** Checks that the database answers; rejects when it doesn't, or too slowly. */
export interface DatabaseHealth {
  ping(): Promise<void>;
}
