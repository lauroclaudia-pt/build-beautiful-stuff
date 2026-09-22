# Instalação de raiz — Portal de Recrutamento IPMA

Este pacote contém tudo o que é preciso para instalar o portal (interface) e, se quiser,
o serviço Java com a base de dados PostgreSQL 18.

## 1. Portal (interface) — o que vê na pré-visualização

### Com Docker

```bash
docker build -f Dockerfile.portal -t ipma-portal .
docker run --rm -p 8080:8080 ipma-portal
# abrir http://localhost:8080
```

### Sem Docker (Node 22 ou superior)

```bash
bun install                 # ou: npm install
NITRO_PRESET=node-server NODE_ENV=production bun run build
node .output/server/index.mjs
```

### No Railway (portal igual à pré-visualização)

Este pacote já inclui tudo o que o Railway precisa para o portal:

| Ficheiro | Para que serve |
| --- | --- |
| `Dockerfile.portal` | Compila e executa o portal (React + renderização no servidor, Node 22) |
| `railway.portal.json` | Configuração do serviço Railway do portal |
| `.dockerignore` | Evita enviar ficheiros desnecessários para a imagem |
| `README-portal.md` | Guia detalhado do serviço do portal |

1. Novo serviço a partir deste repositório (**New → GitHub Repo**).
2. Settings → Build → Builder `Dockerfile`, Dockerfile Path `Dockerfile.portal`.
3. Settings → Networking → gerar domínio público (o contentor escuta na porta 8080).
4. O resultado é exatamente o interface da pré-visualização.

> O `Dockerfile` da raiz é do serviço Java. São dois serviços distintos no mesmo projeto Railway.

## 2. Serviço Java + PostgreSQL 18 (opcional)

```bash
docker compose up -d        # base de dados + dados de amostra (pasta initdb/)
```

No Railway, o `Dockerfile` da raiz compila o serviço Java; adicione um serviço
PostgreSQL e ligue as variáveis `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
(ou `DATABASE_URL`).

O endereço da API é depois indicado na aplicação em
**Administração → Gestão do site → Endereço da API**.

## 3. Primeiro acesso

| Conta | Palavra-passe | Perfil |
| --- | --- | --- |
| claudia.lauro@ipma.pt | Claudia@1977 | Administrador (acesso total) |
| helena.marques@ipma.pt | ipma | Administrador / Gestor de RH |
| marta.costa@exemplo.pt | ipma | Candidato |

## 4. Pessoas, departamentos e júri

- Em **Administração → Pessoas e responsabilidades** pode criar pessoas com ou sem login
  e atribuir um departamento a cada uma.
- O botão **Importar de Excel ou CSV** aceita ficheiros `.xlsx`, `.xls` e `.csv` com as
  colunas *Nome*, *Email*, *Telefone*, *NIF* e *Departamento*. As pessoas importadas ficam
  sem login e podem ser escolhidas como membros do júri.
- Na abertura de um procedimento escolhe-se o **Presidente**, **1.º e 2.º Vogal Efetivo** e
  **1.º e 2.º Vogal Suplente** a partir da lista de pessoas, e ainda um
  **Gestor de RH suplente** (facultativo, tem de ser pessoa com login).

### Exemplo de ficheiro CSV

```csv
Nome;Email;Telefone;NIF;Departamento
Ana Rocha;ana.rocha@ipma.pt;218447050;201111111;Divisão de Recursos Humanos
Nuno Lima;nuno.lima@ipma.pt;218447051;202222222;Departamento de Meteorologia
```

> Nota: ficheiros CSV devem ser gravados em UTF-8.
