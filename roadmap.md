# Roadmap

- [x] Escolher direcao de design
- [x] Design system com cores do logotipo IPMA
- [x] Portal publico de vagas + detalhe + candidatura
- [x] Backoffice: painel, gestao de vaga, pipeline, triagem, ata
- [x] SEO por rota
- [ ] Autenticacao: pagina de login funcional
- [ ] Pessoas + responsabilidades (Gestor RH, Gestao, Administrador, Candidato, Juri) com datas inicio/fim e estado ativo/inativo
- [ ] Portal do candidato: candidaturas, estado dos documentos e da candidatura
- [ ] Pedido de backend em Java: nao suportado na Lovable — esclarecer com a utilizadora

## Concluído (login e portal do candidato)
- [x] Página de login `/entrar` com contas de demonstração
- [x] Pessoas com 1 login e várias responsabilidades (Gestor de RH, Gestão, Administrador, Candidato, Júri) com data de início, data de fim e estado
- [x] Gestão de pessoas e responsabilidades em `/backoffice/pessoas`
- [x] Backoffice protegido por responsabilidade ativa
- [x] Portal do candidato `/candidato`: candidaturas, etapas, documentos e alegações

## Em aberto
- [x] Código publicado no GitHub: lauroclaudia-pt/RECRUTAMENTO, branch `lovable/ipma-recrutamento`
- [ ] Backend Java (Railway): falta a URL pública da API para ligar o frontend

## Painel de administração (concluído)
- [x] /backoffice/admin — menu para Pessoas e responsabilidades, Gestão do site e Procedimentos
- [x] /backoffice/site — upload do ícone das páginas e do favicon, cores dos botões/títulos/realce, título e lead da página inicial, mostrar/esconder filtros
- [x] Filtro por cargo/carreira na página inicial
- [x] Formulário de candidatura atualizado (NIF módulo 11, maioridade, duplicados por NIF+vaga, quota de deficiência com declaração, RJEP, condições especiais, anexos, declaração de veracidade)
- [x] Pipeline por tipo de oferta (modelos de fluxo), entrevista só com EAC, "Concluir triagem provisória" decide entre requisitos em falta e avaliação

## Novos pedidos (2026-09-17)
- [ ] Administração: editar os contactos da página inicial (designação + valor)
- [ ] Página de cada vaga (backoffice): lista de candidaturas com nome, data, estado e botão para atualizar o estado

## Novo pedido (em curso)
- [ ] Menu da landing: "Vagas" → "Home"
- [ ] Painel da vaga: botão para enviar a notificação de cada fase por email (estado atualizado ao clicar)
- [ ] Painel da vaga: lista de registos — datas de início/fim das fases (automático), envios de notificações e observações manuais
- [ ] (pendente) Integração com backend Java: corrigir erros de tipos e testar proxy

### Novo pedido — Documentos e atas (22:39 UTC, 2026-09-17)
- Em /backoffice/documentos: cada documento corresponde a uma fase; campos nome, estado, data início e data fim.
- Estado automático: ATIVO se data início ≤ hoje e data fim NULL ou > hoje; senão INATIVO.
- Botão GUARDAR para guardar alterações; botão REMOVER põe data fim = agora e estado INATIVO.
- Painel de Administração: componentes para configurar caixa de correio / envio de emails pela aplicação (requer domínio de envio próprio — apresentar dialog de configuração).
- [x] Correio eletrónico: campos SMTP (servidor de saída, porta, username, password) — FEITO e verificado.
- [x] Documentos e atas com estado ATIVO/INATIVO, Guardar e Remover — verificado com Playwright.

- [ ] Publicar o código atualizado no GitHub (branch lovable/ipma-recrutamento)
- [x] Gestão de dados: botões de ação com ícone de lápis (editar) e caixote (remover)
