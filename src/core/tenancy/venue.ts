import { DEFAULT_LOCALE, LOCALES, type Locale } from "../i18n/locale";
import type { LocalizedText } from "../i18n/localized-text";
import {
  DEFAULT_CONTACT_FIELD_POLICIES,
  type ContactFieldPolicies,
} from "./contact-fields";
import type { OrgId, VenueId } from "./ids";
import { parseTimeOfDay, type TimeOfDay } from "./time-of-day";

/** Organizations and venues are suspended, never deleted. */
export type RecordStatus = "active" | "suspended";

export interface Organization {
  readonly id: OrgId;
  /** Legal or trading name; not customer-facing, so not localized. */
  readonly name: string;
  readonly status: RecordStatus;
}

/** Venue settings read from Stage 3 on; editable from F-VENUE-LOCALES and F-VENUE-SETTINGS. */
export interface VenueSettings {
  /** IANA name such as `Europe/Warsaw`; set by the operator, no default. */
  readonly timezone: string;
  /** When the venue's business day starts, in local time (default 04:00). */
  readonly businessDayStart: TimeOfDay;
  readonly defaultLocale: Locale;
  /** Never empty, and always includes `defaultLocale`. */
  readonly enabledLocales: readonly Locale[];
  /** Whether the browser language picks the locale before the venue default. */
  readonly browserLocaleEnabled: boolean;
  readonly contactFields: ContactFieldPolicies;
  /** An `https://` URL, or null until the venue sets one. */
  readonly privacyNoticeUrl: string | null;
}

export interface Venue {
  readonly id: VenueId;
  readonly orgId: OrgId;
  readonly slug: string;
  /** Always has a non-empty value for `settings.defaultLocale`. */
  readonly name: LocalizedText;
  readonly status: RecordStatus;
  readonly settings: VenueSettings;
}

/** Defaults for every setting except the timezone, which the operator chooses. */
export const DEFAULT_VENUE_SETTINGS: Omit<VenueSettings, "timezone"> = {
  businessDayStart: parseTimeOfDay("04:00"),
  defaultLocale: DEFAULT_LOCALE,
  enabledLocales: LOCALES,
  browserLocaleEnabled: true,
  contactFields: DEFAULT_CONTACT_FIELD_POLICIES,
  privacyNoticeUrl: null,
};
