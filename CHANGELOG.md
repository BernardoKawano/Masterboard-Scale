# Changelog

## 2026-06-15

### Changed
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
