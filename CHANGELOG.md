# Changelog

## 2026-06-24

### Fixed
- Corrigido fluxo do Scale Diagnostic no mobile: o chat não fica mais sempre visível por `display: flex` forçado no CSS mobile (header do Archie + campo de resposta apareciam sobre a landing, como na captura de tela), com trava defensiva via classe `.is-open`; scroll da landing liberado; chat ajusta altura/top com `visualViewport` (teclado iOS); formulário abre o chat na mesma página sem redirect que perdia dados no `sessionStorage`; fallback de persistência com `localStorage`.

## 2026-06-16 (mobile · correção crítica)

### Fixed
- Mobile `/edicao-171`: hero, botões e blocos iniciais deixavam de aparecer/interagir porque o `IntersectionObserver` não revelava conteúdo acima da dobra a tempo; agora o hero é revelado imediatamente, há fallback por scroll/viewport e opções de observer mais permissivas em touch.
- Removido `overflow-x: clip` do `html` (risco em Safari/iOS) e sticky CTA oculto não intercepta mais toques (`pointer-events: none`).
- Netlify: redirects explícitos para `/edicao-171` e `/edicao-171/` apontando para a landing publicada em `/landing/`.
- Fallback `noscript` para exibir conteúdo caso JS não carregue.

### Changed
- Ajustes mobile de layout/spacing mantidos e validados em 390px/620px sem overflow horizontal.

## 2026-06-15 (noite · mobile viability)

### Changed
- Mobile `/edicao-171`: removido overflow horizontal real (`scrollWidth` agora igual ao viewport), correções em fixed bars e reveals laterais convertidos para entrada vertical em telas menores.
- Mobile hero/cards: header, hero, tags, prova rápida, cards, quote, logos, stat badge, countdown, turmas e sticky CTA receberam espaçamento/padding/tipografia mais compactos para leitura em 390px, sem salto brusco de largura no breakpoint de 620px.
- Pain cards (01–04): stagger reduzido de 170ms para 130ms para manter cascata perceptível sem fazer o quarto card parecer ausente no mobile.

## 2026-06-19

### Added
- Aba **Pipeline** no dashboard com funil comercial de 6 estágios (Prospecção → Assinado + Sem fit): barras coloridas, contagem por estágio, lista operacional e métricas de conversão.
- Campo persistido `pipelineStage` / `pipelineStageAt` no blob, com inferência automática para registros legados e ação `set_pipeline_stage` via PATCH do dashboard.
- Módulo `lib/dashboard-pipeline.mjs` e testes em `test/dashboard-pipeline.test.js`.

### Changed
- A aba Funil analítica foi substituída pelo pipeline comercial; estágio ajustável no drawer do lead.

## 2026-06-19 (anterior)
- PDF do dashboard (`Abrir PDF`) reescrito em modo papel do brandbook: fundo claro, texto ink (#0A0A0A), labels legíveis e `print-color-adjust: exact` — elimina dourado escuro (#9b7400) sobre hero preto que tornava o texto ilegível na impressão.
- Popup de perguntas/respostas usa a mesma folha de estilos de impressão compartilhada.

### Changed
- Dashboard alinhado ao design system Masterboard: Funnel Display, tokens ink/gold/muted do brandbook e contraste reforçado em textos secundários, pills e drawer.
- Drawer ganhou backdrop escuro com clique fora para fechar e estados `:focus-visible` nos controles interativos.
- Navegação sempre visível; home exibe contadores reais por área; drawer reorganizado em blocos (principal, comercial, risco).
- Tabela de leads com menu `⋯` para ações secundárias, indicadores de ordenação e botão "Copiar selecionados" desabilitado sem seleção.
- Kanban com 5 colunas corretas; exclusão removida dos cards (fica no drawer).
- Modo `?fixture=1` para auditoria visual local com dados de demonstração.
- Criado `lib/dashboard-brand.mjs` como fonte única de tokens e estilos de impressão, com testes em `test/dashboard-brand.test.js`.

### Fixed
- Inicialização do dashboard corrigida: `loadDashboard()` agora roda após helpers de localização, evitando tela vazia.
- Handlers do drawer corrigidos após migração para `type="module"` (delegação de eventos em vez de `onclick` global).

### Changed (iteração UX)
- Empty states do kanban e insights com mensagem contextual e CTA (ir para Leads, limpar filtros, etc.).
- Tabelas com hint “Role para ver mais colunas” e fade lateral quando há scroll horizontal.
- Prévia PDF/Q&A inline em modal com iframe (sem dependência de pop-up).
- Topbar mobile colapsável em “Ações do cockpit”.
- Helpers de UI em `lib/dashboard-ui.mjs` com testes em `test/dashboard-ui.test.js`.

### Changed (prévia e polish)
- Prévia PDF/Q&A via blob URL com estado de carregamento, botão **Nova aba** e painel fullscreen no mobile.
- Empty state da tabela de Leads com CTA (limpar filtros ou voltar ao início).
- Script `npm run audit:dashboard` e screenshots do conteúdo do iframe na auditoria visual.

## 2026-06-16

### Changed
- Neutralizada a copy visível da landing `/edicao-171` para reutilização em múltiplas edições, removendo menções promocionais específicas a "171" e trocando o selo do hero para "2 módulos".
- CTAs da landing agora usam "Submeter participação" e apontam direto para o formulário de candidatura do diagnóstico em `https://masterboard.scaleco.ai/candidatura`.
- Rota da landing alterada de `/edicao-171` para `/landing`.
- Removida a seção de Advisory ScaleCo da landing e da navegação lateral.
- Atualizada a copy dos cards dos módulos da landing e removidas datas dos selos dos cards.
- Adicionada aba `Aceites` no dashboard para visualizar fechamentos recebidos, métricas de produto/pagamento e dados jurídicos.
- Cards gerais de métricas do dashboard agora aparecem apenas na aba `Principal`.
- Simplificada a UI do dashboard com navegação compacta, cabeçalho contextual por aba e resumo principal reduzido a KPIs essenciais.
- Resumo de métricas movido estruturalmente para dentro da aba `Principal`, impedindo exibição nas demais telas.
- Página `Principal` redesenhada como home de navegação sem KPIs duplicados, com botões por área e ícones Material Symbols do Google Fonts.
- Removida a cidade "Curitiba" dos selos dos cards de Módulo 1 e Módulo 2 na landing.
- Removida a data da nota do Módulo 2 sobre a próxima edição do Scale.

### Added
- Cards dos módulos 1 e 2 na seção de programação, com público, tópicos e cases Grupo Barigui/Market4u conforme referência visual.

## 2026-06-15 (noite · refino premium 3)

### Changed
- Pain cards (01–04): reveal de scroll bem mais pronunciado — entrada com `translateY(52px) + scale(0.94)` e curva suave, stagger em cascata; o número (01–04) "estoura" com leve atraso adicional. Desativado em `prefers-reduced-motion`. Confirmado via Playwright que a cascata é visível (cards ocultos antes de entrar no viewport e revelados em sequência ao rolar).
- Quote do método: palavras-chave da promessa foram grifadas com `mark` para herdar o amarelo Masterboard (`slides`, `arquitetura`, `negócio`, `2 dias`, `Fábio`).

## 2026-06-15 (noite · refino premium 2)

### Changed
- Hero-visual: "171/Edição" movido para o canto inferior direito (fora do rosto do Fábio), com a legenda logo abaixo — sem sobreposições.
- Trust bar do Fábio: além do ícone, agora exibe o nome de cada empresa (HP, SAP, Microsoft, Salesforce).
- Pain cards (01–04) entram em cascata conforme o scroll (reveal lateral com stagger maior); desativado em mobile/reduced-motion.
- Aumentadas as fontes da seção "Método" (eyebrow, títulos e textos dos cards "O que existe…").

### Added
- Profundidade 3D estilo Apple: tilt dos cards do método seguindo o cursor (perspective + rotateX/Y) com camadas em `translateZ` para título/texto. Desativado em toque e com `prefers-reduced-motion`.

## 2026-06-15 (noite · refino premium)

### Changed
- Reduzida a intensidade dos glows nos cards (sombras, anéis dourados e gradientes radiais mais sutis) para tirar o aspecto "festa".
- Hero-visual: "171/Edição" reposicionado para o topo e reduzido, eliminando a sobreposição com a legenda inferior.
- Turmas (Curitiba/Maringá) e provas rápidas do hero ampliadas e com mais destaque (cidade em branco/bold, acento dourado, chips maiores).
- Cards "Crescimento × Escala": bullets maiores e diferenciados (X neutro para atrito, check dourado para sistema), com hover e entrada escalonada por item.
- Bloco "Em todo negócio de R$1M a R$50M…" ampliado, com destaque dourado; pain cards maiores, com índice (01–04) e realce na borda.
- Seção do Fábio mais premium: logos reais (HP, SAP, Microsoft, Salesforce) em SVG monocromático via `mask`, badge `US$2M → US$40M` maior com contagem animada, e a linha "Como construtor." destacada com divisória.

### Added
- Logos das empresas em `public/assets/logos/` (hp, sap, microsoft, salesforce).

## 2026-06-15 (noite)

### Changed
- Redesign visual completo da landing `/edicao-171` para a linguagem premium da Scale (substitui a estética "papel" clara):
  - Fundo preto com `radial-gradient` amarelos e duas "bolas" de glow em blur com respiração (`glowBreath`), como nas outras páginas Scale.
  - Profundidade 3D: cards em vidro escuro com sombras em camadas, brilho de borda no hover, glows pontuais e elevação; seções alternam entre transparentes e painéis "glass" para criar ritmo.
  - Hero aberto sobre o canvas escuro, com foto editorial do Fábio em destaque e selo "171".
  - Header, sticky CTA e thread rail adaptados ao tema escuro (glass + blur).

### Fixed
- Hero-visual nunca aparecia: `data-reveal="clip"` aplicava `clip-path: inset(100%)` zerando a área visível, fazendo o `IntersectionObserver` nunca marcar o elemento como visível (ficava preso oculto). Trocado para reveal `scale` (opacity+zoom), que não zera a caixa.
- Palavras-chave douradas do título do hero não eram pintadas: `transform` de reveal em `<span>` inline que quebrava em várias linhas descartava a 2ª linha no Chromium. Spans do título passaram a `display:block`.
- Corrigido espaçamento dos chips de prova do hero (whitespace colapsado por `inline-flex`).

## 2026-06-15 (tarde)

### Added
- Pagina estatica `analise-ihc-ui-ux.html` (rota `/analise-ihc-ui-ux`) com a analise comparativa de IHC, UI e UX de eventos premium B2B.
- Narrativa em jornada (problema -> IHC -> UX -> UI -> analise por site -> matriz -> padroes -> resultado), reaproveitando o sistema visual do `index.html` (fundo preto, glows amarelos com blur, profundidade 3D) e a fonte Funnel Display.
- Microinteracoes leves: barra de progresso de scroll, revelacao por IntersectionObserver e barras de nota animadas, com fallback para `prefers-reduced-motion`.
- Redirects 200 em `netlify.toml` para `/analise-ihc-ui-ux` e `/analise-ihc-ui-ux/`.

### Changed
- Aplicados aprendizados da análise IHC/UX/UI na landing `/edicao-171`, mantendo a estética "papel":
  - Estados de acessibilidade e feedback de ação: `:focus-visible` em CTAs/links/FAQ/thread rail, `:active` com microfeedback de pressão nos botões e `skip-link` para pular ao conteúdo.
  - Reforço de CTA inline ao fim das seções `method` e `schedule` (evita o "CTA enterrado" e segue o padrão de CTA repetido por bloco).
  - Faixa de prova com número na seção `offer` (`proof-strip`) reforçando credibilidade com dados reais já presentes na página.

## 2026-06-15

### Added
- Criada a landing Astro/Tailwind da Edição 171 em `/edicao-171`, com seções 00 a 12 seguindo o wireframe e o brandbook Masterboard.
- Adicionados dados editáveis para cards, FAQ, oferta e cronograma reservado da landing.
- Implementados helpers testáveis para progresso de scroll, countdown e CTA sticky.

### Changed
- Configurado build Astro para publicar `dist` no Netlify, copiando as páginas estáticas legadas para preservar `/`, `/candidatura`, `/aceite` e dashboard.
- Revisada a landing `/edicao-171` para priorizar a assinatura "Masterboard powered by ScaleCo", incluir logos reais e reduzir a aparência de wireframe com menos molduras e rolagem.
- Alinhada a landing `/edicao-171` ao design system Masterboard: canvas claro, hero ink, cards com `paper shadow`, cantos angulares e copy sem urgência fabricada.
- Ajustada a landing `/edicao-171` com Funnel Display local, fotos reais de Fábio Couto, hierarquia de títulos revisada, seções ink alternadas e indicador ativo no scroll.
- Refinada a landing `/edicao-171` com menos repetição de logos/CTAs, sombras de papel padronizadas e palavras-chave grifadas em amarelo.
- Ajustado o titulo da pagina `/aceite` para "Vamos fechar?".
- Incluida a opcao de produto "Combo Club + Scale" no formulario e na validacao server-side.
- Adicionado accordion de entregaveis da Imersao Scale na etapa de produto.
- Marcados visualmente os campos obrigatorios do formulario de aceite.
- Reduzido o flick visual removendo o scroll suave automatico a cada renderizacao de etapa.

## 2026-06-12

### Added
- Pagina estatica `aceite.html` para registrar aceite de fechamento em `/aceite`.
- Endpoint `/api/deal-acceptance` para validar, persistir e notificar a equipe sobre novos aceites.
- Normalizacao e patch de registros `deal_acceptance` com status `deal_accepted`.
- Testes automatizados para dados de aceite com CNPJ, produto e forma de pagamento.
- Auto-preenchimento de dados da empresa por CNPJ no formulario `/aceite`.
- Visualizacao dedicada de aceites no dashboard, com produto, pagamento, documento e dados juridicos.
- Variavel `DEAL_ACCEPTANCE_RECIPIENTS` para direcionar notificacoes de aceite ao comercial.
- Fluxo do formulario `/aceite` em slides, com progresso, animacoes e layout responsivo.

## 2026-06-11

### Added
- Dashboard privado em `dashboard.html` para consultar leads e diagnosticos por link com token.
- Endpoint protegido `/api/dashboard` para listar registros persistidos no Netlify Blobs.
- Persistencia de captura, inicio, conclusao e erro do diagnostico na store `scale-diagnostics`.
- `leadId` gerado no frontend para correlacionar formulario, chat e relatorio.
- Testes automatizados com `node --test` para helpers de normalizacao, merge e resumo.
- Documentacao operacional em `DASHBOARD.md`.

### Changed
- O envio de e-mails para Fabio e Bernardo foi preservado, mas o dashboard passa a ser a fonte consultavel dos dados.
- `netlify.toml` agora tambem redireciona `/api/dashboard` para a funcao serverless correspondente.
