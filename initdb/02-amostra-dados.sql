-- Amostra de dados para a plataforma de recrutamento do IPMA.
-- Executar DEPOIS do arranque do serviço Java (as tabelas são criadas pelo Flyway).
-- É idempotente: pode ser executado várias vezes sem duplicar registos.

DO $$
DECLARE
  tbl text := NULL;
BEGIN
  -- Localiza a tabela de utilizadores, qualquer que seja o nome usado pelo backend.
  SELECT c.relname INTO tbl
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN ('app_user', 'users', 'utilizador', 'hr_user')
  LIMIT 1;

  IF tbl IS NULL THEN
    RAISE NOTICE 'Tabela de utilizadores ainda não existe. Arranque primeiro o serviço Java e volte a executar este ficheiro.';
    RETURN;
  END IF;

  EXECUTE format(
    'INSERT INTO public.%I (name, email, password, role)
       SELECT %L, %L, crypt(%L, gen_salt(''bf'')), %L
       WHERE NOT EXISTS (SELECT 1 FROM public.%I WHERE email = %L)',
    tbl, 'Claudia', 'claudia.lauro@ipma.pt', 'Claudia@1977', 'ADMIN', tbl, 'claudia.lauro@ipma.pt'
  );

  RAISE NOTICE 'Utilizador claudia.lauro@ipma.pt garantido na tabela %', tbl;
END $$;
