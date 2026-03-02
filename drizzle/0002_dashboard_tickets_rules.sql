ALTER TABLE "core"."tickets"
ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ADD COLUMN IF NOT EXISTS "description" text;
--> statement-breakpoint

UPDATE "core"."tickets"
SET "title" = COALESCE(NULLIF("subject", ''), 'Sem titulo')
WHERE "title" IS NULL;
--> statement-breakpoint

UPDATE "core"."tickets"
SET "description" = ''
WHERE "description" IS NULL;
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ALTER COLUMN "title" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ALTER COLUMN "description" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ALTER COLUMN "title" SET DEFAULT 'Sem titulo';
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ALTER COLUMN "description" SET DEFAULT '';
--> statement-breakpoint

UPDATE "core"."tickets"
SET "status" = CASE
  WHEN "status" = 'OPEN' THEN 'aguardando'
  WHEN "status" = 'IN_PROGRESS' THEN 'em_atendimento'
  WHEN "status" = 'CLOSED' THEN 'concluido'
  ELSE "status"
END;
--> statement-breakpoint

ALTER TABLE "core"."tickets"
ALTER COLUMN "status" SET DEFAULT 'aguardando';
