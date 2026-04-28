DO $$
BEGIN
  CREATE TYPE "public"."contract_status" AS ENUM('Ativo', 'Cancelado', 'Inadimplente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."expense_category" AS ENUM('Infraestrutura', 'APIs', 'Operacional', 'Marketing', 'Pessoal', 'Tributos', 'Outros');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM('Pendente', 'Pago', 'Vencido', 'Cancelado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."contracts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "title" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "status" "contract_status" DEFAULT 'Ativo' NOT NULL,
  "start_date" timestamp NOT NULL,
  "due_date" timestamp NOT NULL,
  "end_date" timestamp,
  "document_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."expenses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "description" text NOT NULL,
  "category" "expense_category" DEFAULT 'Outros' NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "expense_date" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "core"."payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "contract_id" uuid,
  "amount" numeric(12, 2) NOT NULL,
  "status" "payment_status" DEFAULT 'Pendente' NOT NULL,
  "due_date" timestamp NOT NULL,
  "paid_at" timestamp,
  "description" text,
  "reference_month" varchar(7),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."system_settings" ALTER COLUMN "instance_name" SET DEFAULT 'eeyCore';
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "trade_name" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "email" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "phone" varchar(20);
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "zip_code" varchar(9);
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "street" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "number" varchar(20);
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "complement" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "neighborhood" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "city" text;
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN IF NOT EXISTS "state" varchar(2);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core' AND table_name = 'contracts'
  ) THEN
    ALTER TABLE "core"."contracts" ADD COLUMN IF NOT EXISTS "amount" numeric(12, 2);
    ALTER TABLE "core"."contracts" ADD COLUMN IF NOT EXISTS "due_date" timestamp;
    ALTER TABLE "core"."contracts" ADD COLUMN IF NOT EXISTS "document_url" text;
    ALTER TABLE "core"."contracts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

    UPDATE "core"."contracts"
    SET
      "amount" = COALESCE("amount", 0),
      "due_date" = COALESCE("due_date", "end_date", "start_date", "created_at", now()),
      "updated_at" = COALESCE("updated_at", "created_at", now());

    ALTER TABLE "core"."contracts" ALTER COLUMN "amount" SET NOT NULL;
    ALTER TABLE "core"."contracts" ALTER COLUMN "due_date" SET NOT NULL;
    ALTER TABLE "core"."contracts" ALTER COLUMN "updated_at" SET NOT NULL;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'core'
        AND table_name = 'contracts'
        AND column_name = 'status'
        AND udt_name <> 'contract_status'
    ) THEN
      ALTER TABLE "core"."contracts" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "core"."contracts"
      ALTER COLUMN "status" TYPE "public"."contract_status"
      USING (
        CASE
          WHEN "status"::text IN ('Ativo', 'active') THEN 'Ativo'
          WHEN "status"::text IN ('Inadimplente', 'overdue') THEN 'Inadimplente'
          WHEN "status"::text IN ('Cancelado', 'expired', 'terminated', 'inactive') THEN 'Cancelado'
          ELSE 'Ativo'
        END
      )::"public"."contract_status";
    END IF;

    ALTER TABLE "core"."contracts" ALTER COLUMN "status" SET DEFAULT 'Ativo';
    ALTER TABLE "core"."contracts" ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core' AND table_name = 'payments'
  ) THEN
    ALTER TABLE "core"."payments" ADD COLUMN IF NOT EXISTS "contract_id" uuid;
    ALTER TABLE "core"."payments" ADD COLUMN IF NOT EXISTS "reference_month" varchar(7);
    ALTER TABLE "core"."payments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'core'
        AND table_name = 'payments'
        AND column_name = 'amount'
        AND data_type <> 'numeric'
    ) THEN
      ALTER TABLE "core"."payments"
      ALTER COLUMN "amount" TYPE numeric(12, 2)
      USING NULLIF(
        replace(
          replace(regexp_replace("amount"::text, '[^0-9,.-]', '', 'g'), '.', ''),
          ',',
          '.'
        ),
        ''
      )::numeric(12, 2);
    END IF;

    UPDATE "core"."payments"
    SET
      "amount" = COALESCE("amount", 0),
      "updated_at" = COALESCE("updated_at", "created_at", now());

    ALTER TABLE "core"."payments" ALTER COLUMN "amount" SET NOT NULL;
    ALTER TABLE "core"."payments" ALTER COLUMN "updated_at" SET NOT NULL;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'core'
        AND table_name = 'payments'
        AND column_name = 'status'
        AND udt_name <> 'payment_status'
    ) THEN
      ALTER TABLE "core"."payments" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "core"."payments"
      ALTER COLUMN "status" TYPE "public"."payment_status"
      USING (
        CASE
          WHEN "status"::text IN ('Pago', 'paid') THEN 'Pago'
          WHEN "status"::text IN ('Vencido', 'overdue') THEN 'Vencido'
          WHEN "status"::text IN ('Cancelado', 'canceled') THEN 'Cancelado'
          ELSE 'Pendente'
        END
      )::"public"."payment_status";
    END IF;

    ALTER TABLE "core"."payments" ALTER COLUMN "status" SET DEFAULT 'Pendente';
    ALTER TABLE "core"."payments" ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contracts_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "core"."contracts"
    ADD CONSTRAINT "contracts_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "core"."payments"
    ADD CONSTRAINT "payments_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_contract_id_contracts_id_fk'
  ) THEN
    ALTER TABLE "core"."payments"
    ADD CONSTRAINT "payments_contract_id_contracts_id_fk"
    FOREIGN KEY ("contract_id") REFERENCES "core"."contracts"("id")
    ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
