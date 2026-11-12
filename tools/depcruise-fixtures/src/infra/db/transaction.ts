// The raw transaction helper; only the scoped helpers and tests may call it.
export type Tx = { readonly kind: "tx" };
export const withTransaction = (): Tx => ({ kind: "tx" });
