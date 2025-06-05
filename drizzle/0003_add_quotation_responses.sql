-- Migration: Add Quotation Responses Tables
-- Created: $(date)
-- Description: Add tables for tracking detailed quotation responses at SKU level

-- Create quotation_responses table
CREATE TABLE IF NOT EXISTS "quotation_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_version_id" integer NOT NULL,
	"response_number" integer NOT NULL,
	"overall_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"response_date" timestamp NOT NULL,
	"customer_contact_person" varchar(255),
	"communication_method" varchar(20) DEFAULT 'EMAIL' NOT NULL,
	"overall_comments" text,
	"requested_delivery_date" date,
	"payment_terms_requested" varchar(255),
	"special_instructions" text,
	"recorded_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create quotation_response_items table
CREATE TABLE IF NOT EXISTS "quotation_response_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_response_id" integer NOT NULL,
	"quotation_version_item_id" integer NOT NULL,
	"sku_id" integer NOT NULL,
	"item_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"requested_quantity" integer,
	"requested_unit_price" real,
	"requested_total_price" real,
	"customer_sku_reference" varchar(100),
	"item_specific_comments" text,
	"alternative_suggestions" text,
	"delivery_requirements" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "quotation_responses" ADD CONSTRAINT "quotation_responses_quotation_version_id_quotation_versions_id_fk" FOREIGN KEY ("quotation_version_id") REFERENCES "quotation_versions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quotation_responses" ADD CONSTRAINT "quotation_responses_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quotation_response_items" ADD CONSTRAINT "quotation_response_items_quotation_response_id_quotation_responses_id_fk" FOREIGN KEY ("quotation_response_id") REFERENCES "quotation_responses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quotation_response_items" ADD CONSTRAINT "quotation_response_items_quotation_version_item_id_quotation_version_items_id_fk" FOREIGN KEY ("quotation_version_item_id") REFERENCES "quotation_version_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quotation_response_items" ADD CONSTRAINT "quotation_response_items_sku_id_inventory_items_id_fk" FOREIGN KEY ("sku_id") REFERENCES "inventory_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_quotation_responses_version_id" ON "quotation_responses" ("quotation_version_id");
CREATE INDEX IF NOT EXISTS "idx_quotation_responses_status" ON "quotation_responses" ("overall_status");
CREATE INDEX IF NOT EXISTS "idx_quotation_responses_date" ON "quotation_responses" ("response_date");
CREATE INDEX IF NOT EXISTS "idx_quotation_response_items_response_id" ON "quotation_response_items" ("quotation_response_id");
CREATE INDEX IF NOT EXISTS "idx_quotation_response_items_sku_id" ON "quotation_response_items" ("sku_id");
CREATE INDEX IF NOT EXISTS "idx_quotation_response_items_status" ON "quotation_response_items" ("item_status");

-- Add unique constraint to ensure one response per version per response number
CREATE UNIQUE INDEX IF NOT EXISTS "unique_version_response_number" ON "quotation_responses" ("quotation_version_id", "response_number");
