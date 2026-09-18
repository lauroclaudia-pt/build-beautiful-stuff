#!/bin/sh
set -eu

# O Railway não injeta automaticamente as variáveis de outro serviço.
# Aceita uma ligação Spring explícita, as variáveis PG* referenciadas pelo
# serviço Java, ou DATABASE_URL fornecida pelo serviço PostgreSQL.
if [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  if [ -n "${PGHOST:-}" ] && [ -n "${PGPORT:-}" ] && [ -n "${PGDATABASE:-}" ]; then
    export SPRING_DATASOURCE_URL="jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}"
    export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-${PGUSER:-}}"
    export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-${PGPASSWORD:-}}"
  elif [ -n "${DATABASE_URL:-}" ]; then
    database_url="${DATABASE_URL#postgresql://}"
    database_url="${database_url#postgres://}"
    credentials="${database_url%%@*}"
    address="${database_url#*@}"
    host_port="${address%%/*}"
    database_query="${address#*/}"

    export SPRING_DATASOURCE_URL="jdbc:postgresql://${host_port}/${database_query}"
    export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-${credentials%%:*}}"
    export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-${credentials#*:}}"
  else
    echo "ERRO: o PostgreSQL não está ligado ao serviço Java." >&2
    echo "No Railway, adicione PGHOST, PGPORT, PGDATABASE, PGUSER e PGPASSWORD como referências do serviço Postgres." >&2
    exit 78
  fi
fi

if [ -z "${SPRING_DATASOURCE_USERNAME:-}" ] || [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
  echo "ERRO: faltam o utilizador ou a palavra-passe do PostgreSQL no serviço Java." >&2
  exit 78
fi

exec java ${JAVA_OPTS:-} -Dserver.port="${PORT:-8080}" -jar /app/app.jar