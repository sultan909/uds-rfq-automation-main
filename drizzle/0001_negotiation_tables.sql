-- Add negotiation tables for enhanced RFQ tracking

CREATE TABLE "negotiation_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" integer NOT NULL,
	"version_id" integer,
	"communication_type" varchar(20) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"contact_person" varchar(255),
	"communication_date" timestamp NOT NULL,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"entered_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sku_negotiation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" integer NOT NULL,
	"sku_id" integer NOT NULL,
	"version_id" integer,
	"communication_id" integer,
	"change_type" varchar(20) NOT NULL,
	"old_quantity" integer,
	"new_quantity" integer,
	"old_unit_price" real,
	"new_unit_price" real,
	"change_reason" text,
	"changed_by" varchar(20) DEFAULT 'CUSTOMER' NOT NULL,
	"entered_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "negotiation_communications" ADD CONSTRAINT "negotiation_communications_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_communications" ADD CONSTRAINT "negotiation_communications_version_id_quotation_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_communications" ADD CONSTRAINT "negotiation_communications_entered_by_user_id_users_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_negotiation_history" ADD CONSTRAINT "sku_negotiation_history_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_negotiation_history" ADD CONSTRAINT "sku_negotiation_history_sku_id_inventory_items_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_negotiation_history" ADD CONSTRAINT "sku_negotiation_history_version_id_quotation_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."quotation_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_negotiation_history" ADD CONSTRAINT "sku_negotiation_history_communication_id_negotiation_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."negotiation_communications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_negotiation_history" ADD CONSTRAINT "sku_negotiation_history_entered_by_user_id_users_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;