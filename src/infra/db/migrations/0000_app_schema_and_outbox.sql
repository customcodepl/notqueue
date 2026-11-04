CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."outbox_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app"."outbox_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispatched_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "outbox_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "app"."outbox_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "outbox_events_pending_idx" ON "app"."outbox_events" USING btree ("id") WHERE "app"."outbox_events"."dispatched_at" is null;--> statement-breakpoint
-- Hand-written (not tracked by drizzle-kit): no access to schema app beyond
-- the owner, and RLS also applies to the table owner outside of migrations.
REVOKE ALL ON SCHEMA "app" FROM PUBLIC;--> statement-breakpoint
ALTER TABLE "app"."outbox_events" FORCE ROW LEVEL SECURITY;
