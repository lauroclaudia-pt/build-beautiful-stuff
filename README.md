# Pacote de instalação no Railway — API Java + PostgreSQL 18

Este pacote contém tudo o que é preciso para pôr o servidor de recrutamento
(Java / Spring Boot 3, Java 21) e a base de dados PostgreSQL 18 a correr no Railway.

## Ficheiros

| Ficheiro | Onde colocar | Para que serve |
| --- | --- | --- |
| `Dockerfile` | raiz do repositório Java | compila com Maven e cria a imagem de execução |
| `railway.json` (ou `railway.toml`) | raiz do repositório Java | define construção, arranque e verificação de saúde |
| `application-prod.properties` | `src/main/resources/` | configuração do perfil de produção |
| `.env.example` | referência | lista das variáveis a definir no Railway |
| `initdb/01-extensions.sql` | consola SQL do Postgres | extensões e fuso horário |
| `docker-compose.yml` | local | ambiente igual ao Railway, para testar no computador |

## Instalação passo a passo

1. **Criar o projeto** em https://railway.app → *New Project*.
2. **Base de dados**: *Add service → Database → PostgreSQL*. Confirmar a versão 18
   em *Settings → Image* (`postgres:18-alpine` se for preciso fixar).
   Abrir a consola de SQL e correr `initdb/01-extensions.sql`.
3. **Serviço da API**: *Add service → GitHub Repo* e escolher o repositório do
   backend Java (com o `Dockerfile` e o `railway.json` na raiz).
4. **Variáveis**: abrir *Variables* **no serviço Java** e adicionar referências ao
   serviço PostgreSQL (o Railway não as copia automaticamente):
   - `PGHOST` = `${{Postgres.PGHOST}}`
   - `PGPORT` = `${{Postgres.PGPORT}}`
   - `PGDATABASE` = `${{Postgres.PGDATABASE}}`
   - `PGUSER` = `${{Postgres.PGUSER}}`
   - `PGPASSWORD` = `${{Postgres.PGPASSWORD}}`

   Em alternativa, adicionar `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
   O pacote transforma qualquer uma destas opções na ligação exigida pelo Java.
   Não definir `PGHOST=localhost`: cada serviço Railway corre isoladamente.
5. **Domínio**: o endereço público atual da API é
   `https://build-beautiful-stuff-production.up.railway.app`.
6. **Ligar ao portal**: no portal, Administração → Gestão do site → campo
   «Servidor de recrutamento (endereço da API)», colar esse endereço.
7. **Confirmar**: `https://<dominio>/actuator/health` deve devolver `{"status":"UP"}`
   e `https://<dominio>/api/public/jobs` a lista de procedimentos.

## Notas

- As migrações da base de dados correm sozinhas no arranque (Flyway).
- Se as referências da base de dados estiverem ausentes, o arranque termina com
  uma mensagem de configuração clara em vez de tentar `localhost:5432`.
- O volume do PostgreSQL tem de ficar ativo para os dados não se perderem entre instalações.
- Em `APP_CORS_ALLOWED_ORIGINS` deve constar o endereço publicado do portal.
- O portal também fala com a API através de um reencaminhamento interno, por isso
  funciona mesmo que o CORS ainda não esteja configurado.

## Testar no computador

```bash
docker compose -f deploy/railway/docker-compose.yml up --build
# API em http://localhost:8081, base de dados em localhost:5432
```
