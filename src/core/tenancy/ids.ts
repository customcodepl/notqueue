declare const brand: unique symbol;

/** A string that has been checked to be a particular kind of ID. */
type Id<Kind extends string> = string & { readonly [brand]: Kind };

/** The tenant: an organization's ID. */
export type OrgId = Id<"OrgId">;
export type VenueId = Id<"VenueId">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function parseId<Kind extends string>(kind: Kind, value: unknown): Id<Kind> {
  if (!isUuid(value)) throw new TypeError(`${kind} must be a UUID`);
  return value.toLowerCase() as Id<Kind>;
}

export const parseOrgId = (value: unknown): OrgId => parseId("OrgId", value);
export const parseVenueId = (value: unknown): VenueId =>
  parseId("VenueId", value);
