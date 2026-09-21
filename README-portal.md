# Pacote de instalação do Portal de Recrutamento (interface)

Este pacote serve o **mesmo interface que vê na pré-visualização**, a partir do seu próprio
servidor (Railway, ou qualquer máquina com Docker). O serviço Java continua separado.

## O que está incluído

| Ficheiro | Para que serve |
| --- | --- |
| `Dockerfile.portal` | Compila e executa o portal (React + renderização no servidor, Node 22) |
| `railway.portal.json` | Configuração do serviço Railway do portal |
| `.dockerignore` | Evita enviar `node_modules` e ficheiros temporários para a imagem |
| `Dockerfile` / `railway.json` | Continuam a ser do **serviço Java** (backend) |

## Instalar no Railway (serviço novo, ao lado do Java)

1. No projeto Railway: **New → GitHub Repo** e escolha este repositório
   (`lauroclaudia-pt/build-beautiful-stuff`, ramo `main`).
2. Em **Settings → Build**:
   - Builder: `Dockerfile`
   - Dockerfile Path: `Dockerfile.portal`
3. Em **Settings → Networking**: gerar domínio público. O contentor escuta na porta `8080`
   (o Railway injeta `PORT` automaticamente).
4. Deploy. Ao abrir o domínio vê o portal exatamente como na pré-visualização.

> Importante: não aponte este serviço para o `Dockerfile` da raiz — esse compila o backend Java.
> São dois serviços distintos no mesmo projeto Railway.

## Ligar o portal ao backend Java

O endereço do servidor de recrutamento é definido dentro da aplicação, em
**Administração → Gestão do site → Endereço da API**, por exemplo:

```
https://build-beautiful-stuff-production.up.railway.app
```

## Correr localmente com Docker

```bash
docker build -f Dockerfile.portal -t ipma-portal .
docker run --rm -p 8080:8080 ipma-portal
# abrir http://localhost:8080
```

## Correr sem Docker (Node 22+)

```bash
bun install            # ou: npm install
NITRO_PRESET=node-server NODE_ENV=production bun run build
node .output/server/index.mjs
```

A variável `NITRO_PRESET=node-server` é o que gera a versão para servidor Node
(`.output/server/index.mjs` + ficheiros estáticos em `.output/public`). Sem essa variável,
a compilação mantém-se igual à da plataforma Lovable.
