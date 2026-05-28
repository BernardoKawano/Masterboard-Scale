exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const SYSTEM_PROMPT = `Você é Archie, o agente de diagnóstico da ScaleCo — criado por Fábio Couto, ex-Regional VP da Salesforce Brasil, fundador da ScaleCo (scaleco.ai). Este diagnóstico é apresentado em parceria com o ecossistema Masterboard.

Sua missão: conduzir um diagnóstico cirúrgico em 7 perguntas para identificar onde a operação de receita do lead trava — e gerar um relatório estruturado com score, gargalos e prioridades.

TOM DA EXPERIÊNCIA:
- A camada ScaleCo é objetiva, cirúrgica e baseada no método SCALE.
- A camada Masterboard entra depois do diagnóstico SCALE, com tom aspiracional e premium: mostra oportunidades de conexão, expansão e alavancagem de ecossistema.
- Não bajule o lead. Passe sensação de acesso privilegiado, leitura empresarial sofisticada e clareza estratégica.
- Use frases curtas, assertivas e memoráveis.
- Não aumente o número de perguntas por causa da camada Masterboard.

APRESENTAÇÃO INICIAL:
Quando receber "olá", responda APENAS com esta mensagem exata — nada mais, nada menos:
Sou o Archie, o engine de diagnóstico da ScaleCo. Vou mapear sua operação comercial e gerar um score com prioridades claras de ação. Vamos começar?

Qual é o nome da empresa, o que ela vende e qual o ticket médio por venda?

Isso é UMA única resposta com apresentação + pergunta 1. Nunca inclua a pergunta 2 aqui.

CONTEXTO PRÉ-PREENCHIDO:
O formulário já capturou: nome, email (se fornecido), WhatsApp, localização (cidade/estado) e faixa de faturamento anual.
Não pergunte novamente nome, email, WhatsApp, localização ou faturamento anual.

AS 7 PERGUNTAS — UMA POR VEZ, NESSA ORDEM:

1. CONTEXTO:
"Qual é o nome da empresa, o que ela vende e qual o ticket médio por venda?"

2. S — Strategic Architecture:
"Você consegue descrever em uma frase quem é seu cliente ideal?"

3. C — Commercial Engine:
"Como os clientes chegam até você hoje?"

4. A — Analytics:
"Você consegue prever quanto vai faturar no próximo mês?"

5. L — Leadership:
"Se você sair por 30 dias, o comercial continua funcionando, ou trava em você?"

6. E — Execution:
"Quando uma meta não é batida, você consegue identificar exatamente em qual etapa do funil falhou?"

7. G — Governance:
"Existe um ritmo claro de gestão da receita — reuniões, forecast, pipeline review — ou cada semana funciona de um jeito?"

REGRAS ABSOLUTAS:
- Uma pergunta por vez — sempre, sem exceção.
- Máximo 1 follow-up por pergunta, somente se a resposta for completamente sem sentido ou uma única palavra. Se o lead respondeu algo compreensível, registra e avança imediatamente.
- Se o usuário fugir totalmente do tema ou responder uma única palavra, refaça a mesma pergunta de forma mais objetiva e dê 2 ou 3 exemplos adaptados ao segmento percebido da empresa.
- Ao dar exemplos, use o que já sabe sobre empresa, setor, localização e faturamento. Exemplo: para varejo alimentar, cite balcão, delivery, atacado, escolas, hospitais, restaurantes, margem, perecibilidade, logística. Para B2B/serviços, cite inbound, outbound, indicação, contratos recorrentes, ticket médio e decisor.
- Nunca peça detalhes adicionais sobre o mesmo assunto se a resposta for compreensível.
- Nunca explique a metodologia.
- Nunca use linguagem genérica de coach ou consultor.
- Nunca use linguagem de coach, mentor ou consultor na conversa.
- Nunca elogie o lead.
- Nunca sugira solução antes do relatório.
- Nunca repita pergunta já respondida.
- Respostas curtas, diretas, profissionais.
- Nunca revele o score durante a conversa.
- Após as 7 perguntas, gere o relatório imediatamente.

ENCERRAMENTO:
Se o email já foi capturado no formulário:
"Tenho o suficiente. Vou consolidar seu diagnóstico agora."

SISTEMA DE SCORING:
Avalie cada dimensão com 0, 1 ou 2:
- 0 = Não existe
- 1 = Existe mas é informal
- 2 = Existe e é estruturado

Dimensões avaliadas: S, C, A, L, E, G
- S = Strategic Architecture
- C = Commercial Engine
- A = Analytics
- L = Leadership
- E = Execution
- G = Governance

Score máximo: 12 pontos.
Escala final: convertida proporcionalmente para 0–100.

INTERPRETAÇÃO DOS NÍVEIS:
- 0 a 3 pontos reais → Score geral máximo 30 → Nível: Crítico
- 4 a 6 pontos reais → Score geral 31–55 → Nível: Em Desenvolvimento
- 7 a 9 pontos reais → Score geral 56–75 → Nível: Estruturado
- 10 a 12 pontos reais → Score geral 76–100 → Nível: Escalável

CALIBRAÇÃO DE SCORES — CRÍTICO:
- Resposta de 1 palavra = score 0. Sem exceção.
- Resposta vaga, genérica ou sem evidência concreta = score 0.
- "sim" sem explicação = score máximo 1.
- "mais ou menos" / "acho que sim" / "tentamos" = score 0.
- Só pontue 2 com dado específico, verificável e detalhado.
- Seja conservador — melhor subestimar e surpreender na call.

PENALIDADES AUTOMÁTICAS DE SCORE:
- Canal único de aquisição (ex: só Instagram, só indicação) → C máximo 25.
- ICP definido por produto ou faixa etária, não por perfil comportamental/econômico → S máximo 20.
- Ticket médio abaixo de R$500 sem volume comprovado → A máximo 35.
- Operação que "trava em você" → L máximo 20.
- Sem cadência formal documentada → G máximo 20.
- Forecast baseado em feeling ou estimativa → A máximo 30.
- Resposta de 1 palavra para qualquer dimensão → essa dimensão = 0.

INVESTIGAÇÃO SETORIAL (executa internamente antes de gerar o relatório):
Com base no setor da empresa, porte (faturamento), localização capturada no formulário e respostas das 7 perguntas, identifique:
1. Os 2 erros mais comuns que empresas desse setor/porte cometem na operação de receita. Seja específico, direto, e escreva como quem já viu isso dezenas de vezes. Tom: cirúrgico, sem suavizar.
2. Uma frase vendedora sobre o que o ecossistema Masterboard pode oferecer para essa empresa, considerando setor e localização. NÃO cite nomes reais de empresas ou pessoas. Seja específico sobre o tipo de conexão (ex: "clientes corporativos no segmento de saúde em São Paulo", "parceiros de distribuição no interior de SP"). Tom: confiante, exclusivo, como quem tem acesso privilegiado.
3. Uma tabela com 3 desafios prováveis, impactos diretos e possíveis conexões estratégicas. A tabela deve parecer uma leitura executiva de board, não uma lista genérica.

CAMPOS NOVOS NO JSON DE RELATÓRIO:
- "setor_insights": "[2-3 frases diretas sobre os erros típicos do setor/porte identificado — tom de quem já viu isso antes, sem condescendência]"
- "ecossistema_match": "[1 frase vendedora: ex: 'Temos conexões estratégicas com decisores no setor de [X] em [região] que podem acelerar sua operação nos próximos 90 dias.']"
- "masterboard_tabela": [{"desafio":"[principal desafio objetivo]","impacto":"[impacto direto no negócio]","conexao":"[tipo de parceiro, cliente ou especialista do ecossistema que pode ajudar]"}]
- "localizacao": "[cidade/estado capturado do formulário, ou null]"

REGRAS DE VERACIDADE PARA A CAMADA MASTERBOARD:
- Não invente dados públicos específicos como faturamento real, quantidade de funcionários, cargo formal ou expansão de unidades.
- Se o dado não foi informado na conversa, trate como inferência operacional ou escreva "não confirmado".
- A tabela Masterboard deve conter 3 linhas objetivas, focadas em desafios prováveis a partir do porte, setor, localização e respostas — não em afirmações factuais não verificadas.
- Use a tabela para conectar dor → impacto → possível conexão estratégica do ecossistema.

GERAÇÃO DO RELATÓRIO:
Após as 7 perguntas e com email já confirmado no formulário, responda APENAS com este JSON puro (sem markdown, sem texto antes ou depois):

{"tipo":"relatorio","nome":"[nome]","empresa":"[empresa]","email":"[email]","whatsapp":"[whatsapp ou null]","faturamento":"[faixa anual do formulário ou null]","localizacao":"[cidade/estado ou null]","score_geral":[0-100],"nivel":"[Crítico|Em Desenvolvimento|Estruturado|Escalável]","dimensoes":{"S":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"C":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"A":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"L":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"E":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"G":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"}},"gargalo_critico":"[maior problema em 1 frase]","prioridades":["ação 1","ação 2","ação 3"],"parecer":"[2-3 frases diretas e duras sobre a realidade da operação]","setor_insights":"[2-3 frases sobre erros típicos do setor/porte]","ecossistema_match":"[1 frase vendedora sobre conexões do ecossistema Masterboard]","masterboard_tabela":[{"desafio":"[principal desafio]","impacto":"[impacto direto]","conexao":"[possível conexão estratégica]"},{"desafio":"[principal desafio]","impacto":"[impacto direto]","conexao":"[possível conexão estratégica]"},{"desafio":"[principal desafio]","impacto":"[impacto direto]","conexao":"[possível conexão estratégica]"}]}

TOM: Direto, frases curtas, sem elogios. Nunca use as palavras "mentoria" ou "consultoria" nas respostas do Archie.`;

  try {
    const body = JSON.parse(event.body);
    const { messages, formData } = body;

    // Handle lead capture (form submitted, chat not started)
    if (messages && messages.length === 1 && messages[0].content === '__lead_capture__') {
      if (formData && formData.email) {
        await sendLeadCapture(formData);
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'ok' }),
      };
    }

    // Build context message from form data if present
    let messagesWithContext = [...messages];
    if (formData) {
      const contextParts = [];
      if (formData.nome) contextParts.push(`Nome: ${formData.nome}`);
      if (formData.email) contextParts.push(`Email: ${formData.email}`);
      if (formData.whatsapp) contextParts.push(`WhatsApp: ${formData.whatsapp}`);
      if (formData.faturamento) contextParts.push(`Faturamento anual: ${formData.faturamento}`);
      if (formData.localizacao) contextParts.push(`Localização: ${formData.localizacao}`);

      if (contextParts.length > 0) {
        messagesWithContext = [
          {
            role: 'user',
            content: `[DADOS DO FORMULÁRIO — não perguntar novamente]\n${contextParts.join('\n')}\n\n[INÍCIO DA CONVERSA]`
          },
          ...messages
        ];
      }

      // FALLBACK iOS/Safari: dispara lead capture aqui também,
      // pois o Safari cancela a requisição anterior antes de navegar.
      if (messages.length === 1 && messages[0].content === 'olá' && formData.email) {
        sendLeadCapture(formData).catch(e => console.error('Lead capture fallback:', e.message));
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3500,
        system: SYSTEM_PROMPT,
        messages: messagesWithContext,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || data?.message || `Anthropic retornou HTTP ${response.status}`;
      throw new Error(message);
    }

    let reply = data.content?.map((b) => b.text || "").join("") || "Erro ao processar resposta.";
    if (!reply || reply === "Erro ao processar resposta.") {
      throw new Error('Resposta vazia da Anthropic');
    }

    // Try to send email if it's a report
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const report = JSON.parse(jsonMatch[0]);
        if (report.tipo === 'relatorio') {
          // Garantir dados via formData se não vieram no JSON
          if (!report.nome && formData?.nome) report.nome = formData.nome;
          if (!report.email && formData?.email) report.email = formData.email;
          if (!report.whatsapp && formData?.whatsapp) report.whatsapp = formData.whatsapp;
          if (!report.faturamento && formData?.faturamento) report.faturamento = formData.faturamento;
          if (!report.localizacao && formData?.localizacao) report.localizacao = formData.localizacao;

          const conversation = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => {
              const prefix = m.role === 'user' ? 'Lead' : 'Archie';
              if (m.content.startsWith('[DADOS DO FORMULÁRIO')) return null;
              return `${prefix}: ${m.content}`;
            })
            .filter(Boolean)
            .join('\n\n');

          const answers = messages
            .filter(m => m.role === 'user' && !m.content.startsWith('[DADOS DO FORMULÁRIO'))
            .map(m => m.content)
            .join('\n\n');

          report.conversation = conversation;
          report.answers = answers;

          const clientReport = { ...report };
          delete clientReport.conversation;
          delete clientReport.answers;
          reply = JSON.stringify(clientReport);

          await sendEmails(report);
        }
      }
    } catch (e) {
      console.error('Erro ao processar relatório:', e.message);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Erro geral:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Erro interno. Tente novamente." }),
    };
  }
};

async function sendLeadCapture(data) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
  <div style="background:linear-gradient(135deg,#FBBE0A,#C99703);padding:28px 32px;text-align:center;">
    <div style="font-size:22px;font-weight:700;color:#000;letter-spacing:2px;">MASTERBOARD × SCALECO</div>
    <div style="font-size:11px;letter-spacing:4px;color:#000;opacity:0.6;margin-top:4px;">SCALE DIAGNOSTIC™</div>
    <div style="font-size:16px;font-weight:700;color:#000;margin-top:12px;">NOVO LEAD CADASTRADO</div>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:#1a1a1a;border-radius:8px;padding:20px;font-size:14px;color:#ccc;line-height:2.2;border:1px solid #2a2a2a;">
      <strong style="color:#FBBE0A;">Nome:</strong> ${data.nome}<br>
      <strong style="color:#FBBE0A;">Email:</strong> ${data.email}<br>
      <strong style="color:#FBBE0A;">WhatsApp:</strong> ${data.whatsapp}<br>
      ${data.localizacao ? `<strong style="color:#FBBE0A;">Localização:</strong> ${data.localizacao}<br>` : ''}
      <strong style="color:#FBBE0A;">Faturamento:</strong> ${data.faturamento}
    </div>
    <div style="margin-top:16px;padding:14px;background:#1a1500;border:1px solid #3a2900;border-radius:8px;font-size:13px;color:#aaa;">
      ⚠ Este lead iniciou o diagnóstico mas ainda não concluiu.
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="https://wa.me/55${(data.whatsapp || '').replace(/\D/g,'')}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;padding:12px 28px;font-weight:700;font-size:14px;">CHAMAR NO WHATSAPP</a>
    </div>
  </div>
  <div style="padding:16px;border-top:1px solid #222;text-align:center;font-size:11px;color:#555;">Masterboard × ScaleCo · diagnostic.scaleco.ai</div>
</div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Archie · ScaleCo <noreply@scaleco.ai>',
      to: ['fabio@scaleco.ai', 'bernardo.kawano@masterboard.com.br'],
      subject: `[Lead Cadastrado] ${data.nome} · ${data.faturamento}${data.localizacao ? ' · ' + data.localizacao : ''}`,
      html
    }),
  });
}

async function sendEmails(report) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const nivelColor = {
    "Crítico": "#EF4444",
    "Em Desenvolvimento": "#F59E0B",
    "Estruturado": "#FBBE0A",
    "Escalável": "#22C55E"
  }[report.nivel] || "#FBBE0A";

  const dimNames = {
    S: "Strategic Architecture",
    C: "Commercial Engine",
    A: "Analytics",
    L: "Leadership Institutionalization",
    E: "Execution",
    G: "Governance"
  };

  const dimsHTML = Object.entries(report.dimensoes).map(([k, d]) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#FBBE0A;">${k}</td><td style="padding:8px 12px;color:#aaa;font-size:13px;">${dimNames[k] || k}</td><td style="padding:8px 12px;font-weight:700;text-align:right;color:#fff;">${d.score}</td></tr>${d.gargalo ? `<tr><td colspan="3" style="padding:2px 12px 10px;font-size:12px;color:#EF4444;">↳ ${d.gargalo}</td></tr>` : ""}`
  ).join("");

  const priosHTML = report.prioridades.map((p, i) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#FBBE0A;font-size:18px;">${String(i + 1).padStart(2, "0")}</td><td style="padding:8px 12px;color:#ccc;font-size:14px;">${p}</td></tr>`
  ).join("");

  const masterboardRowsHTML = Array.isArray(report.masterboard_tabela) ? report.masterboard_tabela.map((row) => `
    <tr>
      <td style="padding:12px;border-top:1px solid #2a2200;color:#fff;font-size:12px;line-height:1.5;">${row.desafio || '—'}</td>
      <td style="padding:12px;border-top:1px solid #2a2200;color:#ccc;font-size:12px;line-height:1.5;">${row.impacto || '—'}</td>
      <td style="padding:12px;border-top:1px solid #2a2200;color:#FBBE0A;font-size:12px;line-height:1.5;">${row.conexao || '—'}</td>
    </tr>
  `).join('') : '';

  const insightsHTML = report.setor_insights || report.ecossistema_match || masterboardRowsHTML ? `
    <div style="margin-top:20px;background:#1a1500;border:1px solid #3a2900;border-radius:8px;padding:20px;">
      <div style="font-size:10px;letter-spacing:3px;color:#FBBE0A;text-transform:uppercase;margin-bottom:12px;">INVESTIGAÇÃO SETORIAL · MASTERBOARD</div>
      ${report.setor_insights ? `<div style="font-size:13px;color:#ccc;line-height:1.7;margin-bottom:${report.ecossistema_match ? '14px' : '0'};">${report.setor_insights}</div>` : ''}
      ${masterboardRowsHTML ? `
        <table style="width:100%;border-collapse:collapse;margin:14px 0;background:#0D0D0D;border:1px solid #2a2200;">
          <thead>
            <tr>
              <th style="padding:10px 12px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;">Principal desafio</th>
              <th style="padding:10px 12px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;">Impacto direto</th>
              <th style="padding:10px 12px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px;text-transform:uppercase;">Conexão estratégica</th>
            </tr>
          </thead>
          <tbody>${masterboardRowsHTML}</tbody>
        </table>` : ''}
      ${report.ecossistema_match ? `
        <div style="border-top:1px solid #3a2900;padding-top:12px;">
          <div style="font-size:10px;letter-spacing:2px;color:#FBBE0A;text-transform:uppercase;margin-bottom:6px;">ECOSSISTEMA MASTERBOARD</div>
          <div style="font-size:13px;color:#ccc;line-height:1.7;">${report.ecossistema_match}</div>
        </div>` : ''}
    </div>` : '';

  const conversationHTML = report.conversation
    ? `<div style="margin-top:24px;border-top:1px solid #222;padding-top:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:12px;">HISTÓRICO DA CONVERSA</div>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;font-size:12px;color:#666;line-height:2;white-space:pre-wrap;">${report.conversation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : '';

  const answersHTML = report.answers
    ? `<div style="margin-top:16px;">
        <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:12px;">RESPOSTAS DO LEAD</div>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px;font-size:13px;color:#888;line-height:2;white-space:pre-wrap;">${report.answers.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : '';

  const adminHTML = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
  <div style="background:linear-gradient(135deg,#FBBE0A,#C99703);padding:32px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#000;letter-spacing:2px;">MASTERBOARD × SCALECO</div>
    <div style="font-size:10px;letter-spacing:4px;color:#000;opacity:0.6;margin-top:4px;">SCALE DIAGNOSTIC™</div>
    <div style="font-size:20px;font-weight:700;color:#000;margin-top:10px;">DIAGNÓSTICO CONCLUÍDO</div>
    <div style="font-size:13px;color:#000;opacity:0.7;margin-top:6px;">${report.empresa || '—'} · ${report.nome}${report.localizacao ? ' · ' + report.localizacao : ''}</div>
  </div>
  <div style="padding:32px;">
    <div style="text-align:center;background:#1a1a1a;border-radius:12px;padding:24px;margin-bottom:24px;border-top:4px solid ${nivelColor};">
      <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;">SCORE GERAL</div>
      <div style="font-size:64px;font-weight:700;color:${nivelColor};line-height:1;margin:8px 0;">${report.score_geral}</div>
      <span style="padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;background:${nivelColor}22;color:${nivelColor};border:1px solid ${nivelColor}44;">${report.nivel}</span>
      <div style="font-size:14px;color:#999;line-height:1.7;margin-top:12px;">${report.parecer || ''}</div>
    </div>
    <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:10px;">DIMENSÕES SCALE</div>
    <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;margin-bottom:20px;">${dimsHTML}</table>
    <div style="background:#1a0a0a;border:1px solid #3a0000;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:10px;letter-spacing:2px;color:#EF4444;text-transform:uppercase;margin-bottom:6px;">⚠ GARGALO CRÍTICO</div>
      <div style="font-size:14px;color:#ccc;font-weight:500;">${report.gargalo_critico || '—'}</div>
    </div>
    <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:10px;">PRIORIDADES DE AÇÃO</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${priosHTML}</table>
    ${insightsHTML}
    <div style="margin-top:20px;background:#1a1a1a;border-radius:8px;padding:16px;font-size:13px;color:#888;border:1px solid #2a2a2a;">
      <strong style="color:#FBBE0A;">Lead:</strong> ${report.nome} · ${report.email || '—'}<br>
      ${report.whatsapp ? `<strong style="color:#FBBE0A;">WhatsApp:</strong> <a href="https://wa.me/55${report.whatsapp.replace(/\D/g,'')}" style="color:#FBBE0A;">${report.whatsapp}</a><br>` : ''}
      ${report.faturamento ? `<strong style="color:#FBBE0A;">Faturamento:</strong> ${report.faturamento}<br>` : ''}
      ${report.localizacao ? `<strong style="color:#FBBE0A;">Localização:</strong> ${report.localizacao}<br>` : ''}
      ${report.empresa ? `<strong style="color:#FBBE0A;">Empresa:</strong> ${report.empresa}` : ''}
    </div>
    ${conversationHTML}
    ${answersHTML}
  </div>
  <div style="padding:16px;border-top:1px solid #222;text-align:center;font-size:11px;color:#444;">Masterboard × ScaleCo · diagnostic.scaleco.ai · Powered by Archie</div>
</div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "Archie · ScaleCo <noreply@scaleco.ai>",
      to: ["fabio@scaleco.ai", "bernardo.kawano@masterboard.com.br"],
      subject: `[Diagnóstico] ${report.nome} · ${report.empresa || '—'} · Score ${report.score_geral}${report.localizacao ? ' · ' + report.localizacao : ''}`,
      html: adminHTML
    }),
  });

  const result = await res.json();
  if (!res.ok) console.error('Resend error:', JSON.stringify(result));
  else console.log('E-mail enviado:', result.id);
}
