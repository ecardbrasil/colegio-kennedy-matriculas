// roteiro.js
// Modulo puro (sem DOM, sem fetch) que monta o roteiro de conversa
// exibido em card.html a partir dos dados do card. Cada bloco decide
// sozinho se entra no roteiro (quando) e qual texto mostrar (texto).
// Adicionar uma nova condicao aqui nunca deve exigir mudar card.js.

function montarRoteiro(card) {
  const blocos = [
    {
      id: 'abertura',
      quando: () => true,
      texto: (c) =>
        `Bem-vindo(a)! Vamos falar sobre a visita de ${c.nome_aluno_1 || 'seu filho ou sua filha'} na Kennedy.`,
    },
    {
      id: 'origem_campanha',
      quando: (c) => !!c.utm_campaign,
      texto: (c) =>
        `A família chegou pela campanha "${c.utm_campaign}". Pergunte o que mais chamou atenção no anúncio.`,
    },
    {
      id: 'multiplos_filhos',
      quando: (c) => Number(c.quantidade_alunos) > 1,
      texto: (c) =>
        `Família com ${c.quantidade_alunos} filhos. Reforce o desconto de irmãos e mostre as turmas de cada série.`,
    },
    {
      id: 'segundo_responsavel_ausente',
      quando: (c) => !c.responsavel_2_nome,
      texto: () =>
        'Apenas um responsável está cadastrado. Se o segundo responsável também estiver presente, colete o nome e o telefone dele no bloco Responsável 2, logo abaixo.',
    },
    {
      id: 'necessidade_especial',
      quando: (c) =>
        !!c.necessidade_especial &&
        c.necessidade_especial.toLowerCase() !== 'nao' &&
        c.necessidade_especial.toLowerCase() !== 'não',
      texto: (c) =>
        c.necessidade_especial_obs
          ? `Necessidade educacional especial informada: ${c.necessidade_especial_obs}. Inclua a equipe pedagógica de apoio no roteiro da visita.`
          : 'Necessidade educacional especial informada. Inclua a equipe pedagógica de apoio no roteiro da visita.',
    },
  ];

  return blocos.filter((b) => b.quando(card)).map((b) => ({ id: b.id, texto: b.texto(card) }));
}

window.montarRoteiro = montarRoteiro;
