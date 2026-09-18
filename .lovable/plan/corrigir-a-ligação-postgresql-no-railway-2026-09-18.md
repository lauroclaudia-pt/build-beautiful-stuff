# Corrigir a ligação PostgreSQL no Railway

## Alterações
- Fazer o arranque Java reconhecer automaticamente `SPRING_DATASOURCE_URL`, `DATABASE_URL` ou as variáveis `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD` do Railway.
- Incluir a configuração de produção no servidor Java durante a construção, impedindo a utilização silenciosa de `localhost:5432`.
- Interromper o arranque com uma mensagem clara quando a base de dados não estiver ligada ao serviço.
- Atualizar o guia com as referências exatas do serviço PostgreSQL 18 e o endereço público informado.
- Validar os ficheiros e publicar a correção no GitHub.

## Configuração necessária no Railway
O serviço Java terá de referenciar as variáveis do serviço PostgreSQL. O código suporta tanto referências individuais como `DATABASE_URL`; nenhuma palavra-passe será guardada no repositório.
