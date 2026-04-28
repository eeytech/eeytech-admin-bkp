CREATE TABLE IF NOT EXISTS "core"."companies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "cnpj" varchar(18),
  "status" varchar(20) DEFAULT 'active' NOT NULL,
  "application_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."users" ADD COLUMN IF NOT EXISTS "is_application_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."user_companies" (
  "user_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_companies_user_id_company_id_pk" PRIMARY KEY("user_id","company_id")
);
--> statement-breakpoint
ALTER TABLE "core"."tickets" ADD COLUMN IF NOT EXISTS "company_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_application_id_applications_id_fk'
  ) THEN
    ALTER TABLE "core"."companies" ADD CONSTRAINT "companies_application_id_applications_id_fk"
    FOREIGN KEY ("application_id") REFERENCES "core"."applications"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_companies_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "core"."user_companies" ADD CONSTRAINT "user_companies_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_companies_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "core"."user_companies" ADD CONSTRAINT "user_companies_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "core"."tickets" ADD CONSTRAINT "tickets_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_application_idx" ON "core"."companies" ("application_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_status_idx" ON "core"."companies" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_company_idx" ON "core"."tickets" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_companies_company_idx" ON "core"."user_companies" ("company_id");
--> statement-breakpoint
INSERT INTO "core"."companies" ("name", "status", "application_id", "created_at", "updated_at")
SELECT
  concat(a."name", ' - Principal'),
  'active',
  a."id",
  now(),
  now()
FROM "core"."applications" a
WHERE NOT EXISTS (
  SELECT 1
  FROM "core"."companies" c
  WHERE c."application_id" = a."id"
);
--> statement-breakpoint
UPDATE "core"."tickets" t
SET "company_id" = c."id"
FROM LATERAL (
  SELECT c2."id"
  FROM "core"."companies" c2
  WHERE c2."application_id" = t."application_id"
  ORDER BY c2."created_at" ASC
  LIMIT 1
) c
WHERE t."company_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "core"."tickets" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
INSERT INTO "core"."user_companies" ("user_id", "company_id", "created_at")
SELECT
  u."id",
  c."id",
  now()
FROM "core"."users" u
JOIN LATERAL (
  SELECT c2."id"
  FROM "core"."companies" c2
  WHERE c2."application_id" = u."application_id"
  ORDER BY c2."created_at" ASC
  LIMIT 1
) c ON true
ON CONFLICT ("user_id", "company_id") DO NOTHING;
