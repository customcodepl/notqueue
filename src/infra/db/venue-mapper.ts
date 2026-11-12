import { isLocale, type Locale } from "@/core/i18n/locale";
import { parseOrgId, parseVenueId } from "@/core/tenancy/ids";
import type { Venue } from "@/core/tenancy/venue";
import { isVenueSlug } from "@/core/tenancy/venue-slug";
import { parseTimeOfDay } from "@/core/tenancy/time-of-day";

import type { venues } from "./schema";

type VenueRow = typeof venues.$inferSelect;
type VenueInsert = typeof venues.$inferInsert;

// Locale codes are checked here, not in SQL, so adding a locale stays a
// change in core only (ADR-0019; F-TENANT-CORE decision 5).

function locale(value: string): Locale {
  if (!isLocale(value)) throw new TypeError(`Unsupported locale "${value}"`);
  return value;
}

/** A venue row as the domain sees it; rejects locales `core` doesn't support. */
export function toVenue(row: VenueRow): Venue {
  return {
    id: parseVenueId(row.id),
    orgId: parseOrgId(row.orgId),
    slug: row.slug,
    name: row.name,
    status: row.status,
    settings: {
      timezone: row.timezone,
      // Postgres returns `time(0)` as HH:mm:ss.
      businessDayStart: parseTimeOfDay(row.businessDayStart.slice(0, 5)),
      defaultLocale: locale(row.defaultLocale),
      enabledLocales: row.enabledLocales.map(locale),
      browserLocaleEnabled: row.browserLocaleEnabled,
      contactFields: {
        name: row.contactNamePolicy,
        phone: row.contactPhonePolicy,
        email: row.contactEmailPolicy,
      },
      privacyNoticeUrl: row.privacyNoticeUrl,
    },
  };
}

/** Column values for a venue; checks what SQL doesn't (slug in the app, locale codes). */
export function toVenueRow(venue: Omit<Venue, "id" | "status">): VenueInsert {
  if (!isVenueSlug(venue.slug)) throw new TypeError("Invalid venue slug");
  const { settings } = venue;
  for (const code of [settings.defaultLocale, ...settings.enabledLocales]) {
    locale(code);
  }
  return {
    orgId: venue.orgId,
    slug: venue.slug,
    name: venue.name,
    timezone: settings.timezone,
    businessDayStart: settings.businessDayStart,
    defaultLocale: settings.defaultLocale,
    enabledLocales: [...settings.enabledLocales],
    browserLocaleEnabled: settings.browserLocaleEnabled,
    contactNamePolicy: settings.contactFields.name,
    contactPhonePolicy: settings.contactFields.phone,
    contactEmailPolicy: settings.contactFields.email,
    privacyNoticeUrl: settings.privacyNoticeUrl,
  };
}
