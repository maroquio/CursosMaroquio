CREATE TYPE "public"."calendar_event_type" AS ENUM('live', 'deadline', 'mentoring', 'other');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lesson_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('video', 'text', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."section_content_type" AS ENUM('text', 'video', 'quiz', 'exercise', 'interactive');--> statement-breakpoint
CREATE TABLE "llm_manufacturers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "llm_manufacturers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "llm_models" (
	"id" text PRIMARY KEY NOT NULL,
	"manufacturer_id" text NOT NULL,
	"name" text NOT NULL,
	"technical_name" varchar(200) NOT NULL,
	"price_per_million_input_tokens" real DEFAULT 0 NOT NULL,
	"price_per_million_output_tokens" real DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "llm_models_technical_name_unique" UNIQUE("technical_name")
);
--> statement-breakpoint
CREATE TABLE "oauth_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"email" text,
	"name" text,
	"avatar_url" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_token" text,
	"user_agent" text,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"assigned_by" text,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"assigned_by" text,
	CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"assigned_by" text,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp with time zone NOT NULL,
	"time" varchar(10),
	"type" "calendar_event_type" DEFAULT 'other' NOT NULL,
	"course_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"course_name" text NOT NULL,
	"student_name" text NOT NULL,
	"certificate_number" varchar(50) NOT NULL,
	"sequential_number" integer NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	CONSTRAINT "certificates_enrollment_id_unique" UNIQUE("enrollment_id"),
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number"),
	CONSTRAINT "certificates_sequential_number_unique" UNIQUE("sequential_number")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"banner_url" text,
	"short_description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"level" varchar(20),
	"category_id" text,
	"tags" text[],
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"instructor_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"exercise_correction_prompt" text,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"enrolled_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lesson_bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"version" integer NOT NULL,
	"entrypoint" text DEFAULT 'index.html' NOT NULL,
	"storage_path" text NOT NULL,
	"manifest_json" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "unique_lesson_version" UNIQUE("lesson_id","version")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" "lesson_progress_status" DEFAULT 'not_started' NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"last_watched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"content" text,
	"video_url" text,
	"duration" integer DEFAULT 0 NOT NULL,
	"type" "lesson_type" DEFAULT 'video' NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"exercise_correction_prompt" text
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"exercise_correction_prompt" text
);
--> statement-breakpoint
CREATE TABLE "section_bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"version" integer NOT NULL,
	"entrypoint" text DEFAULT 'index.html' NOT NULL,
	"storage_path" text NOT NULL,
	"manifest_json" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "unique_section_version" UNIQUE("section_id","version")
);
--> statement-breakpoint
CREATE TABLE "section_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"section_id" text NOT NULL,
	"status" "lesson_progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone,
	CONSTRAINT "unique_enrollment_section" UNIQUE("enrollment_id","section_id")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content_type" "section_content_type" DEFAULT 'text' NOT NULL,
	"content" jsonb,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "llm_models" ADD CONSTRAINT "llm_models_manufacturer_id_llm_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."llm_manufacturers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_bundles" ADD CONSTRAINT "lesson_bundles_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_bundles" ADD CONSTRAINT "section_bundles_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_progress" ADD CONSTRAINT "section_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_progress" ADD CONSTRAINT "section_progress_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_llm_manufacturers_slug" ON "llm_manufacturers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_llm_manufacturers_name" ON "llm_manufacturers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_llm_models_manufacturer_id" ON "llm_models" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "idx_llm_models_technical_name" ON "llm_models" USING btree ("technical_name");--> statement-breakpoint
CREATE INDEX "idx_llm_models_is_default" ON "llm_models" USING btree ("is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_provider_user" ON "oauth_connections" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_user_provider" ON "oauth_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "idx_oauth_connections_user_id" ON "oauth_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_permissions_resource" ON "permissions" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_permissions_name" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_permissions_resource_action" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_user_id" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_permission_id" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_date" ON "calendar_events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_type" ON "calendar_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_course_id" ON "calendar_events" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_categories_name" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_certificates_student_id" ON "certificates" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_certificates_enrollment_id" ON "certificates" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_certificates_course_id" ON "certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_courses_slug" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_courses_status" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_courses_instructor_id" ON "courses" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "idx_courses_category_id" ON "courses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_course_id" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_status" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lesson_bundles_lesson_id" ON "lesson_bundles" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_bundles_active" ON "lesson_bundles" USING btree ("lesson_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_lesson_progress_enrollment_id" ON "lesson_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_progress_lesson_id" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_progress_status" ON "lesson_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lessons_module_id" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_lessons_order" ON "lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "idx_lessons_slug" ON "lessons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_modules_course_id" ON "modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_modules_order" ON "modules" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX "idx_section_bundles_section_id" ON "section_bundles" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_section_bundles_active" ON "section_bundles" USING btree ("section_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_section_progress_enrollment_id" ON "section_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_section_progress_section_id" ON "section_progress" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_sections_lesson_id" ON "sections" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_sections_order" ON "sections" USING btree ("lesson_id","order");