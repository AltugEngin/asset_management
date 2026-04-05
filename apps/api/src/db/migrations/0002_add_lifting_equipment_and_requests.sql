CREATE TYPE "public"."equipment_request_status" AS ENUM('beklemede', 'onaylandı', 'reddedildi');--> statement-breakpoint
CREATE TYPE "public"."lifting_equipment_group" AS ENUM('manlift', 'vinç', 'sepet');--> statement-breakpoint
CREATE TABLE "equipment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"requested_by_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "equipment_request_status" DEFAULT 'beklemede' NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifting_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"group" "lifting_equipment_group" NOT NULL,
	"description" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lifting_equipment_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_equipment_id_lifting_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."lifting_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;