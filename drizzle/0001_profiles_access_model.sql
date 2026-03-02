ALTER TABLE "core"."applications"
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint

ALTER TABLE "core"."users"
ADD COLUMN IF NOT EXISTS "name" text;
--> statement-breakpoint

ALTER TABLE "core"."users"
ADD COLUMN IF NOT EXISTS "application_id" uuid;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "core"."system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "instance_name" text DEFAULT 'Admin Eeytech' NOT NULL,
  "api_url" text DEFAULT 'https://api.eeytech.com.br' NOT NULL,
  "session_timeout" text DEFAULT '15' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "core"."roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" varchar(50) NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "core"."role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "role_id" uuid NOT NULL,
  "module_slug" text NOT NULL,
  "actions" text[] NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "core"."user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roles_application_id_applications_id_fk'
  ) THEN
    ALTER TABLE "core"."roles"
    ADD CONSTRAINT "roles_application_id_applications_id_fk"
    FOREIGN KEY ("application_id")
    REFERENCES "core"."applications"("id")
    ON DELETE cascade
    ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_roles_id_fk'
  ) THEN
    ALTER TABLE "core"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_roles_id_fk"
    FOREIGN KEY ("role_id")
    REFERENCES "core"."roles"("id")
    ON DELETE cascade
    ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "core"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_users_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "core"."users"("id")
    ON DELETE cascade
    ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_id_roles_id_fk'
  ) THEN
    ALTER TABLE "core"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_roles_id_fk"
    FOREIGN KEY ("role_id")
    REFERENCES "core"."roles"("id")
    ON DELETE cascade
    ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

INSERT INTO "core"."applications" ("name", "slug", "api_key", "is_active")
VALUES ('Eeytech Admin', 'eeytech-admin', 'eeytech-admin-local-key', true)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

UPDATE "core"."users"
SET "name" = split_part("email", '@', 1)
WHERE "name" IS NULL OR "name" = '';
--> statement-breakpoint

UPDATE "core"."users" "u"
SET "application_id" = "a"."id"
FROM "core"."applications" "a"
WHERE "u"."application_id" IS NULL
  AND "a"."slug" = 'eeytech-admin';
--> statement-breakpoint

UPDATE "core"."users" "u"
SET "application_id" = "a"."id"
FROM (
  SELECT "id"
  FROM "core"."applications"
  ORDER BY "created_at" ASC
  LIMIT 1
) AS "a"
WHERE "u"."application_id" IS NULL;
--> statement-breakpoint

ALTER TABLE "core"."users"
ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "core"."users"
ALTER COLUMN "application_id" SET NOT NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_application_id_applications_id_fk'
  ) THEN
    ALTER TABLE "core"."users"
    ADD CONSTRAINT "users_application_id_applications_id_fk"
    FOREIGN KEY ("application_id")
    REFERENCES "core"."applications"("id")
    ON DELETE cascade
    ON UPDATE no action;
  END IF;
END $$;
