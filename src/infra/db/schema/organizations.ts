import { sql } from "drizzle-orm";
import { check, pgPolicy, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { app } from "./app";
import { appPlatform, appTenant, currentOrgId } from "./roles";

export const recordStatus = app.enum("record_status", ["active", "suspended"]);

/** The tenant root. A tenant sees only its own row (ADR-0005, ADR-0022). */
export const organizations = app
  .table(
    "organizations",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull(),
      status: recordStatus("status").notNull().default("active"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      // Set by a trigger on update.
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      check("organizations_name_not_blank", sql`btrim(${table.name}) <> ''`),
      pgPolicy("organizations_tenant", {
        for: "select",
        to: appTenant,
        using: sql`${table.id} = ${currentOrgId}`,
      }),
      pgPolicy("organizations_platform", {
        for: "all",
        to: appPlatform,
        using: sql`true`,
        withCheck: sql`true`,
      }),
    ],
  )
  .enableRLS();
