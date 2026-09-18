-- Extensões necessárias na base de dados PostgreSQL 18.
-- No Railway, executar este conteúdo uma vez na consola de SQL do serviço Postgres.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Fuso horário por omissão (datas das fases e dos prazos)
SET TIME ZONE 'Europe/Lisbon';
