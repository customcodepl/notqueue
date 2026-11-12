import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgPolicy,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { LocalizedText } from "@/core/i18n/localized-text";

import { app } from "./app";
import { organizations, recordStatus } from "./organizations";
import { appPlatform, appTenant, currentOrgId } from "./roles";

export const contactFieldPolicy = app.enum("contact_field_policy", [
  "required",
  "optional",
  "hidden",
]);

/**
 * A venue with every setting column and its default (FEATURES.md C-6).
 * Locale codes are checked in the mapper, not here (ADR-0019).
 */
export const venues = app
  .table(
    "venues",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      orgId: uuid("org_id")
        .notNull()
        .references(() => organizations.id),
      slug: text("slug").notNull().unique(),
      name: jsonb("name").$type<LocalizedText>().notNull(),
      status: recordStatus("status").notNull().default("active"),
      // IANA name, validated where it enters the system; no default.
      timezone: text("timezone").notNull(),
      businessDayStart: time("business_day_start", { precision: 0 })
        .notNull()
        .default("04:00"),
      defaultLocale: text("default_locale").notNull().default("pl"),
      enabledLocales: text("enabled_locales")
        .array()
        .notNull()
        .default(sql`'{pl,en}'::text[]`),
      browserLocaleEnabled: boolean("browser_locale_enabled")
        .notNull()
        .default(true),
      contactNamePolicy: contactFieldPolicy("contact_name_policy")
        .notNull()
        .default("required"),
      // ROADMAP Q4: optional by default.
      contactPhonePolicy: contactFieldPolicy("contact_phone_policy")
        .notNull()
        .default("optional"),
      contactEmailPolicy: contactFieldPolicy("contact_email_policy")
        .notNull()
        .default("hidden"),
      privacyNoticeUrl: text("privacy_notice_url"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      // Set by a trigger on update.
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index("venues_org_id_idx").on(table.orgId),
      check(
        "venues_slug_format",
        sql`${table.slug} ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$'`,
      ),
      check("venues_name_object", sql`jsonb_typeof(${table.name}) = 'object'`),
      check(
        "venues_name_has_default_locale",
        sql`btrim(coalesce(${table.name} ->> ${table.defaultLocale}, '')) <> ''`,
      ),
      check(
        "venues_default_locale_enabled",
        sql`cardinality(${table.enabledLocales}) > 0 and ${table.defaultLocale} = any (${table.enabledLocales})`,
      ),
      check(
        "venues_privacy_notice_https",
        sql`${table.privacyNoticeUrl} ~ '^https://'`,
      ),
      pgPolicy("venues_tenant", {
        for: "select",
        to: appTenant,
        using: sql`${table.orgId} = ${currentOrgId}`,
      }),
      pgPolicy("venues_platform", {
        for: "all",
        to: appPlatform,
        using: sql`true`,
        withCheck: sql`true`,
      }),
    ],
  )
  .enableRLS();
