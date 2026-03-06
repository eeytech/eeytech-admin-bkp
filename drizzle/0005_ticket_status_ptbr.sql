UPDATE "core"."tickets"
SET "status" = 'Aberto'
WHERE "status" = 'aguardando';

UPDATE "core"."tickets"
SET "status" = 'Em Atendimento'
WHERE "status" = 'em_atendimento';

UPDATE "core"."tickets"
SET "status" = 'Resolvido'
WHERE "status" = 'concluido';

ALTER TABLE "core"."tickets"
ALTER COLUMN "status" SET DEFAULT 'Aberto';
