-- Create lookup tables
CREATE TABLE "machine_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machine_names_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "machine_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machine_locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "machine_manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machine_manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Migrate existing string data into lookup tables
INSERT INTO "machine_names" ("name")
SELECT DISTINCT "name" FROM "machines" WHERE "name" IS NOT NULL;
--> statement-breakpoint
INSERT INTO "machine_locations" ("name")
SELECT DISTINCT "location" FROM "machines" WHERE "location" IS NOT NULL;
--> statement-breakpoint
INSERT INTO "machine_manufacturers" ("name")
SELECT DISTINCT "manufacturer" FROM "machines" WHERE "manufacturer" IS NOT NULL;
--> statement-breakpoint

-- Add new nullable FK columns
ALTER TABLE "machines" ADD COLUMN "name_id" integer;
--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "location_id" integer;
--> statement-breakpoint
ALTER TABLE "machines" ADD COLUMN "manufacturer_id" integer;
--> statement-breakpoint

-- Populate FK columns from existing string data
UPDATE "machines" m SET "name_id" = mn.id FROM "machine_names" mn WHERE m."name" = mn."name";
--> statement-breakpoint
UPDATE "machines" m SET "location_id" = ml.id FROM "machine_locations" ml WHERE m."location" = ml."name";
--> statement-breakpoint
UPDATE "machines" m SET "manufacturer_id" = mm.id FROM "machine_manufacturers" mm WHERE m."manufacturer" = mm."name";
--> statement-breakpoint

-- Make name_id NOT NULL
ALTER TABLE "machines" ALTER COLUMN "name_id" SET NOT NULL;
--> statement-breakpoint

-- Add FK constraints
ALTER TABLE "machines" ADD CONSTRAINT "machines_name_id_machine_names_id_fk" FOREIGN KEY ("name_id") REFERENCES "public"."machine_names"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_location_id_machine_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."machine_locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_manufacturer_id_machine_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."machine_manufacturers"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Drop old string columns
ALTER TABLE "machines" DROP COLUMN "name";
--> statement-breakpoint
ALTER TABLE "machines" DROP COLUMN "location";
--> statement-breakpoint
ALTER TABLE "machines" DROP COLUMN "manufacturer";
