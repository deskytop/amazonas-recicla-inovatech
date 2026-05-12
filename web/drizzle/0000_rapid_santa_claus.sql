CREATE TYPE "public"."bin_status" AS ENUM('active', 'maintenance', 'full');--> statement-breakpoint
CREATE TYPE "public"."material" AS ENUM('plastic', 'metal', 'glass', 'paper');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('awaiting_material', 'material_detected', 'completed', 'expired', 'failed');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"location_name" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" "bin_status" DEFAULT 'active' NOT NULL,
	"fill_level_percent" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp with time zone,
	"api_key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"level" integer DEFAULT 1 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"lifetime_points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"bin_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"material" "material",
	"points_value" integer,
	"status" "session_status" DEFAULT 'awaiting_material' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"material_detected_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_bin_id_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."bins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bins_code_idx" ON "bins" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_bin_status_idx" ON "sessions" USING btree ("bin_id","status","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_created_idx" ON "sessions" USING btree ("user_id","created_at");