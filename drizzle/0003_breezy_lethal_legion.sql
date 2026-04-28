DO $$
BEGIN
  -- Compatibilidade histórica:
  -- esta migration foi substituída por uma versão idempotente em 0001.
  -- Mantemos o arquivo para preservar a ordem do journal sem reaplicar DDL duplicada.
  NULL;
END $$;
