CREATE TYPE "public"."lesson_status" AS ENUM('planned', 'attended', 'absent_excused', 'absent_unexcused', 'cancelled');--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"slot_id" uuid,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"duration_min" integer NOT NULL,
	"subject" text,
	"status" "lesson_status" DEFAULT 'planned' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"duration_min" integer DEFAULT 45 NOT NULL,
	"subject" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_year" integer,
	"phone" text,
	"parent_name" text,
	"parent_phone" text,
	"parent_email" text,
	"instrument" text,
	"gdpr_consent" boolean DEFAULT false NOT NULL,
	"gdpr_consent_date" date,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#4f46e5' NOT NULL,
	"season_start_month" integer DEFAULT 9 NOT NULL,
	"season_end_month" integer DEFAULT 6 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lessons_ws_date_idx" ON "lessons" USING btree ("workspace_id","date");--> statement-breakpoint
CREATE INDEX "lessons_student_idx" ON "lessons" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_slot_date_uq" ON "lessons" USING btree ("slot_id","date");--> statement-breakpoint
CREATE INDEX "slots_ws_idx" ON "slots" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "slots_student_idx" ON "slots" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "students_ws_idx" ON "students" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspaces_user_idx" ON "workspaces" USING btree ("user_id");