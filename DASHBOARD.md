# Dashboard de Leads e Diagnosticos

## Beliefs
- O fluxo publico continua em `index.html` e `/api/diagnostic`.
- Leads e diagnosticos agora sao persistidos no Netlify Blobs pela store `scale-diagnostics`.
- O e-mail via Resend continua como notificacao, mas nao e mais a unica fonte de consulta.

## Desires
Permitir que pessoas autorizadas acessem um dashboard privado com todos os leads, dados do formulario, status do funil, score, dimensoes SCALE, gargalos, prioridades, insights Masterboard, conversa e respostas.

## Intentions
1. Configure as variaveis no Netlify:
   - `ANTHROPIC_API_KEY`: chave usada pelo Archie.
   - `RESEND_API_KEY`: chave usada para enviar e-mails.
   - `DASHBOARD_TOKEN`: token privado para abrir o dashboard.
2. Compartilhe o link no formato:
   - `https://SEU_DOMINIO/dashboard.html?token=SEU_DASHBOARD_TOKEN`
3. Abra o dashboard e use os filtros por status ou busca textual.

## Persistencia
Cada lead recebe um `leadId` no browser. Esse ID acompanha:
- captura inicial do formulario;
- inicio do diagnostico;
- conclusao com relatorio completo;
- erros durante o diagnostico, quando houver dados do formulario.

Os registros sao salvos com chaves no formato `leads/{leadId}.json`.

## Seguranca
- `/api/dashboard` retorna `401` quando o token esta ausente ou invalido.
- `dashboard.html` usa `noindex,nofollow` e `no-referrer`.
- O token em URL deve ser tratado como segredo. Se um link for compartilhado indevidamente, rotacione `DASHBOARD_TOKEN` no Netlify.

## Metricas
As funcoes registram logs simples:
- `[dashboard_metric] write ... durationMs=...`
- `[dashboard_metric] list total=... durationMs=...`
- `[dashboard_metric] write_failed ...`
- `[dashboard_metric] list_failed ...`

Esses logs ajudam a acompanhar desempenho de escrita, listagem e falhas de persistencia.

## Validacao Local
```bash
npm test
```

Para testar o fluxo completo com Netlify Blobs, use um ambiente Netlify/Netlify Dev com as variaveis configuradas.
