/**
 * The venue's part of its public URL. Lowercase letters, digits and inner
 * hyphens, 3 to 50 characters; unique across all tenants. The same rule is a
 * check constraint on `app.venues.slug`. Reserved words: F-PUBLIC-VENUE.
 */
export const VENUE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

export function isVenueSlug(value: unknown): value is string {
  return typeof value === "string" && VENUE_SLUG_PATTERN.test(value);
}
