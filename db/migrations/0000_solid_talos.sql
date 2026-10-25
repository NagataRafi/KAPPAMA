CREATE TABLE IF NOT EXISTS "album_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"file_key" varchar(255),
	"youtube_id" varchar(50),
	"caption" varchar(255),
	"sort_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"event_date" date,
	"description" text,
	"cover_key" varchar(255),
	"program_id" uuid,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "albums_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alumni_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"graduation_year" integer NOT NULL,
	"current_status" varchar(50) NOT NULL,
	"job_title" varchar(150),
	"organization" varchar(150),
	"industry_id" uuid,
	"work_city" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alumni_details_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bylaws_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"file_key" varchar(255) NOT NULL,
	"effective_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "districts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"username" varchar(50) NOT NULL,
	"whatsapp" varchar(30) NOT NULL,
	"instagram" varchar(50),
	"linkedin" varchar(255),
	"member_type" varchar(20) DEFAULT 'active' NOT NULL,
	"cohort_year" integer NOT NULL,
	"university_id" uuid NOT NULL,
	"university_other" varchar(150),
	"study_program_id" uuid NOT NULL,
	"study_program_other" varchar(150),
	"district_id" varchar(20) NOT NULL,
	"village_id" varchar(20) NOT NULL,
	"address_detail" varchar(255) NOT NULL,
	"photo_key" varchar(255),
	"hide_contact" boolean DEFAULT false NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"approval_type" varchar(20),
	"rejection_reason" text,
	"consent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consent_version" varchar(20) DEFAULT '2026.1' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "member_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_leaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"position" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"photo_key" varchar(255),
	"campus_study" varchar(150),
	"sort_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_label" varchar(50) NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"about_text" text NOT NULL,
	"vision_text" text NOT NULL,
	"missions" jsonb NOT NULL,
	"contact_email" varchar(150),
	"contact_instagram" varchar(100),
	"contact_address" text,
	"logo_key" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"file_key" varchar(255),
	"youtube_id" varchar(50),
	"caption" varchar(255),
	"sort_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"event_date" date,
	"location" varchar(150),
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"objectives" text,
	"targets" text,
	"pic_name" varchar(150),
	"cover_key" varchar(255),
	"university_id" uuid,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"degree_level" varchar(20) DEFAULT 'S1',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"abbreviation" varchar(50),
	"city" varchar(100) DEFAULT 'Malang',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "villages" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"district_id" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_album_media_album_id" ON "album_media" ("album_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_albums_status_year" ON "albums" ("status","year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_albums_slug" ON "albums" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_id" ON "audit_logs" ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs" ("entity","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_profiles_status_type" ON "member_profiles" ("status","member_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_profiles_university" ON "member_profiles" ("university_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_profiles_cohort" ON "member_profiles" ("cohort_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_profiles_district" ON "member_profiles" ("district_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_member_profiles_username" ON "member_profiles" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_leaders_period_id" ON "org_leaders" ("period_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_program_media_program_id" ON "program_media" ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programs_status_year" ON "programs" ("status","year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_programs_slug" ON "programs" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_study_programs_univ_id" ON "study_programs" ("university_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_clerk_id" ON "users" ("clerk_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_villages_district_id" ON "villages" ("district_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "album_media" ADD CONSTRAINT "album_media_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "albums" ADD CONSTRAINT "albums_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alumni_details" ADD CONSTRAINT "alumni_details_member_id_member_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "member_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alumni_details" ADD CONSTRAINT "alumni_details_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "study_programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_leaders" ADD CONSTRAINT "org_leaders_period_id_org_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "org_periods"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_media" ADD CONSTRAINT "program_media_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
