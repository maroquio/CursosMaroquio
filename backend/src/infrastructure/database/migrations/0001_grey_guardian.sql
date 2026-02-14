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
ALTER TABLE "lesson_bundles" ADD CONSTRAINT "lesson_bundles_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lesson_bundles_lesson_id" ON "lesson_bundles" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_bundles_active" ON "lesson_bundles" USING btree ("lesson_id","is_active");