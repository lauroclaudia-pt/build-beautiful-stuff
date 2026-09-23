# Roadmap

- [x] Escolher direcao de design
- [x] Design system com cores do logotipo IPMA
- [x] Portal publico de vagas + detalhe + candidatura
- [x] Backoffice: painel, gestao de vaga, pipeline, triagem, ata
- [x] SEO por rota
- [x] Autenticacao: pagina de login funcional
- [x] Pessoas + responsabilidades (Gestor RH, Gestao, Administrador, Candidato, Juri) com datas inicio/fim e estado ativo/inativo
- [x] Portal do candidato: candidaturas, estado dos documentos e da candidatura
- [x] Backend Java ligado à API alojada no Railway

## Concluído (login e portal do candidato)
- [x] Página de login `/entrar` com contas de demonstração
- [x] Pessoas com 1 login e várias responsabilidades (Gestor de RH, Gestão, Administrador, Candidato, Júri) com data de início, data de fim e estado
- [x] Gestão de pessoas e responsabilidades em `/backoffice/pessoas`
- [x] Backoffice protegido por responsabilidade ativa
- [x] Portal do candidato `/candidato`: candidaturas, etapas, documentos e alegações

## Em aberto
- [x] Código publicado no GitHub: lauroclaudia-pt/RECRUTAMENTO, branch `lovable/ipma-recrutamento`
- [x] Backend Java (Railway): API pública ligada ao frontend

## Painel de administração (concluído)
- [x] /backoffice/admin — menu para Pessoas e responsabilidades, Gestão do site e Procedimentos
- [x] /backoffice/site — upload do ícone das páginas e do favicon, cores dos botões/títulos/realce, título e lead da página inicial, mostrar/esconder filtros
- [x] Filtro por cargo/carreira na página inicial
- [x] Formulário de candidatura atualizado (NIF módulo 11, maioridade, duplicados por NIF+vaga, quota de deficiência com declaração, RJEP, condições especiais, anexos, declaração de veracidade)
- [x] Pipeline por tipo de oferta (modelos de fluxo), entrevista só com EAC, "Concluir triagem provisória" decide entre requisitos em falta e avaliação

## Novos pedidos (2026-09-17)
- [x] Administração: editar os contactos da página inicial (designação + valor)
- [x] Página de cada vaga (backoffice): lista de candidaturas com nome, data, estado e botão para atualizar o estado

## Novo pedido (em curso)
- [x] Menu da landing: "Vagas" → "Home"
- [x] Painel da vaga: botão para enviar a notificação de cada fase por email (estado atualizado ao clicar)
- [x] Painel da vaga: lista de registos — datas de início/fim das fases (automático), envios de notificações e observações manuais
- [x] Integração com backend Java: proxy e tipos configurados

### Novo pedido — Documentos e atas (22:39 UTC, 2026-09-17)
- Em /backoffice/documentos: cada documento corresponde a uma fase; campos nome, estado, data início e data fim.
- Estado automático: ATIVO se data início ≤ hoje e data fim NULL ou > hoje; senão INATIVO.
- Botão GUARDAR para guardar alterações; botão REMOVER põe data fim = agora e estado INATIVO.
- Painel de Administração: componentes para configurar caixa de correio / envio de emails pela aplicação (requer domínio de envio próprio — apresentar dialog de configuração).
- [x] Correio eletrónico: campos SMTP (servidor de saída, porta, username, password) — FEITO e verificado.
- [x] Documentos e atas com estado ATIVO/INATIVO, Guardar e Remover — verificado com Playwright.

- [x] Publicar o código atualizado no GitHub (branch lovable/ipma-recrutamento)
- [x] Gestão de dados: botões de ação com ícone de lápis (editar) e caixote (remover)
- [x] Método de seleção no formulário de candidatura: escolha única (radio)
- [x] Grelhas de avaliação e fórmulas (cap. 8 e 9): critérios com pesos (habilitação, formação, experiência, desempenho), tabela de conversão da avaliação de desempenho, grelha de entrevista com escala 4–20, nota final ponderada por combinação de métodos

## Dashboard (2026-09-18)
- [x] /backoffice/dashboard — KPIs, candidaturas por mês, estado das candidaturas, procedimentos por estado/unidade/tipo, fase atual, requer atenção (prazos ≤ 7 dias e candidaturas por analisar), classificação média por método, documentos e notificações recentes
- [x] Gestor de RH vê por omissão apenas os seus procedimentos (alternável para «Todos»); Administrador e Gestão veem tudo
- [x] Ligação no menu («Dashboard») e cartão em Administração
- [x] Dashboard: filtros por período (30 dias / 90 dias / 12 meses) e por procedimento; exportação para CSV (separador «;», UTF-8 com BOM) e PDF (impressão A4 do browser)

## Formulário de novo procedimento (2026-09-21)
- [x] Referência automática AAAA/N.º sequencial
- [x] Data de publicação preenchida ao publicar
- [x] Unidade orgânica: seleção múltipla
- [x] Métodos de seleção derivados das caixas da tramitação (PC/AC/EAC)
- [x] Campo memo "Características da remuneração"
- [x] Secção "Local de trabalho": vários locais, no máximo tantos quantos o n.º de vagas
- [x] "Painel de vagas" → "Painel de Recrutamento"
- [x] Ao abrir uma vaga no backoffice: mostrar apenas os dados da vaga (consulta); candidaturas só no separador Candidato

- [x] Campo Suplemento Mensal (money) a seguir à Remuneração; obrigatório em Cargos de direção, com validação numérica e asterisco (2026-09-21)

## Instalação do interface em servidor próprio (2026-09-21)
- [x] Pacote do portal para Railway: `Dockerfile.portal`, `railway.portal.json`, `.dockerignore`, `README-portal.md`
- [x] `vite.config.ts` aceita `NITRO_PRESET` (ex.: node-server) e gera `.output/server/index.mjs`

## Campos da vaga e síntese (2026-09-21)
- [x] Descrição da habilitação literária (500 caracteres) a seguir à habilitação mínima
- [x] Requisitos com texto predefinido (alíneas a) a e))
- [x] Memo "Descrição do procedimento"
- [x] Memo "Lista de consulta de legislação/documentos para Prova de Conhecimentos"
- [x] Radio "Admissão sem habilitação exigida" e "Vagas para candidatos com deficiência"
- [x] Síntese do procedimento com todos os campos; mostrar/ocultar no site público e no portal do candidato (Gestão do site)

## Júri, suplente e departamentos (2026-09-22)
- [x] Cinco lugares do júri por seleção de pessoas (Presidente, 1.º/2.º Vogal Efetivo, 1.º/2.º Vogal Suplente)
- [x] Gestor de RH suplente (facultativo, pessoa com login)
- [x] Departamento por pessoa e importação de pessoas por Excel/CSV
- [x] Pacote de instalação de raiz atualizado (ipma-recrutamento-v2.zip)

## Partilha nas redes sociais (2026-09-22)
- [x] Página pública da vaga: botões Partilhar — Facebook, LinkedIn e Instagram (copia a ligação)
- [x] Imagem de partilha (og:image/twitter:image) = logótipo IPMA

## Aviso / Edital e formatação (2026-09-22)
- [x] Campo "N.º Aviso / Edital" com limite de 500 caracteres, antes do texto do aviso
- [x] "Descrição do procedimento" renomeada para "Texto do aviso / edital"
- [x] Parágrafos e quebras de linha preservados nos campos de texto/memo no backoffice

- [x] Gestão de dados: ordenação dos critérios — listas alfabéticas (valor, pt) e tabela ordenável por Valor / Data de início / Data de fim (asc/desc). (2026-09-23)

## Navegação e páginas institucionais (2026-09-23)
- [x] Ocultar «Procedimentos» e «Candidato» no menu sem sessão iniciada
- [x] Gestão do site: nome completo da entidade no rodapé e textos de Acessibilidade e Dados pessoais
- [x] Páginas públicas próprias de Acessibilidade e Dados pessoais
- [x] Gestão do site: permitir alterar a cor de fundo das páginas
