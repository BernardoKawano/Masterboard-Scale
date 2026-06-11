# Changelog

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
