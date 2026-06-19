/** Registros de demonstração para auditoria visual do dashboard (?fixture=1). */
export function getDashboardFixtureRecords() {
  const now = new Date('2026-06-19T14:30:00.000Z');
  const iso = (offsetHours = 0) => new Date(now.getTime() - offsetHours * 3600000).toISOString();

  const conversation = [
    'Archie: Qual é o maior gargalo comercial da empresa hoje?',
    'Lead: Dependemos de indicação e não temos previsibilidade de pipeline.',
    'Archie: Como vocês qualificam oportunidades antes de enviar proposta?',
    'Lead: Cada vendedor faz do seu jeito. Não existe critério único.',
  ].join('\n\n');

  const report = {
    tipo: 'relatorio',
    nome: 'Ana Founder',
    empresa: 'Empresa Alpha',
    email: 'ana@example.com',
    whatsapp: '(11) 99999-9999',
    faturamento: 'R$1M-R$5M/ano',
    localizacao: 'São Paulo, SP',
    score_geral: 68,
    nivel: 'Estruturado',
    dimensoes: {
      S: { score: 72, status: 'ICP documentado', gargalo: '' },
      C: { score: 58, status: 'Canal misto', gargalo: 'Dependência de indicação' },
      A: { score: 64, status: 'Cadência parcial', gargalo: 'Follow-up irregular' },
      L: { score: 70, status: 'CRM adotado', gargalo: '' },
      E: { score: 62, status: 'Governança em evolução', gargalo: 'Rituais não padronizados' },
    },
    gargalo_critico: 'Aquisição depende de relacionamento direto sem cadência previsível.',
    prioridades: ['Documentar ICP', 'Criar cadência semanal de pipeline', 'Padronizar qualificação'],
    parecer: 'Operação com tração, mas ainda depende de pessoas-chave para gerar demanda.',
    setor_insights: 'Empresas B2B desse porte costumam confundir indicação com canal escalável.',
  };

  return [
    {
      leadId: 'fixture_completed_hot',
      status: 'completed',
      commercialStatus: '',
      createdAt: iso(120),
      updatedAt: iso(2),
      completedAt: iso(48),
      formData: { nome: 'Ana Founder', empresa: 'Empresa Alpha', email: 'ana@example.com', whatsapp: '(11) 99999-9999', faturamento: 'R$1M-R$5M/ano', localizacao: 'São Paulo, SP' },
      report,
      conversation,
      answers: 'Dependemos de indicação.\n\nCada vendedor qualifica do seu jeito.',
    },
    {
      leadId: 'fixture_captured',
      status: 'captured',
      commercialStatus: '',
      createdAt: iso(6),
      updatedAt: iso(6),
      formData: { nome: 'Bruno Silva', empresa: 'Beta Indústria', email: 'bruno@beta.com', whatsapp: '(41) 98888-1111', faturamento: 'R$20M+/ano', localizacao: 'Curitiba, PR' },
    },
    {
      leadId: 'fixture_won',
      status: 'completed',
      commercialStatus: 'sold',
      soldAt: iso(24),
      createdAt: iso(200),
      updatedAt: iso(24),
      completedAt: iso(72),
      formData: { nome: 'Carla Mendes', empresa: 'Gamma Serviços', email: 'carla@gamma.com', whatsapp: '(11) 97777-2222', faturamento: 'R$5M-R$20M/ano', localizacao: 'São Paulo, SP' },
      report: { ...report, score_geral: 74, nome: 'Carla Mendes', empresa: 'Gamma Serviços' },
    },
    {
      leadId: 'fixture_lost',
      status: 'completed',
      commercialStatus: 'lost',
      lostAt: iso(12),
      createdAt: iso(300),
      updatedAt: iso(12),
      completedAt: iso(96),
      formData: { nome: 'Diego Rocha', empresa: 'Delta Log', email: 'diego@delta.com', whatsapp: '(21) 96666-3333', faturamento: 'Até R$1M/ano', localizacao: 'Rio de Janeiro, RJ' },
      report: { ...report, score_geral: 38, nivel: 'Crítico', nome: 'Diego Rocha', empresa: 'Delta Log' },
    },
    {
      leadId: 'fixture_acceptance',
      status: 'deal_accepted',
      recordType: 'deal_acceptance',
      acceptedAt: iso(8),
      createdAt: iso(8),
      updatedAt: iso(8),
      formData: {
        recordType: 'deal_acceptance',
        nome: 'Eduardo Prado',
        empresa: 'Epsilon Tech',
        razao_social: 'Epsilon Tech LTDA',
        documento: '12.345.678/0001-90',
        email: 'edu@epsilon.com',
        whatsapp: '(11) 95555-4444',
        produto: 'Combo Club + Scale',
        forma_pagamento: 'cartao a vista',
        endereco: 'Av. Paulista, 1000 - São Paulo/SP',
        localizacao: 'São Paulo, SP',
        faturamento: 'R$5M-R$20M/ano',
      },
    },
  ];
}

export function getDashboardFixturePayload() {
  return {
    records: getDashboardFixtureRecords(),
    generatedAt: new Date('2026-06-19T14:30:00.000Z').toISOString(),
    listDurationMs: 12,
  };
}
