// GET -> cards da fase "7. AGENDOU VISITA", separados em proximas e encerradas.
// Proximas: data/hora ainda não passou. Encerradas: data/hora já passou.
// Exige sessao valida. Retorna payload com arrays { proximas, encerradas }.

const { verifySession } = require('./_lib/session');
const { pipefyRequest, mensagemErroPipefy } = require('./_lib/pipefy');
const { normalizarCampos } = require('./_lib/campos');

const QUERY = `
  query VisitasAgendadas($faseAgendouId: ID!) {
    phase(id: $faseAgendouId) {
      id
      name
      cards(first: 50) {
        edges {
          node {
            id
            title
            fields { name value field { id } }
          }
        }
      }
    }
  }
`;

const JANELA_CHEGANDO_MS = 30 * 60 * 1000;

function parseHorarioVisita(valorBruto) {
  if (!valorBruto || typeof valorBruto !== 'string') return null;
  const texto = valorBruto.trim();
  if (!texto) return null;

  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, dia, mes, ano, hora, minuto] = match;
    const data = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      hora ? Number(hora) : 0,
      minuto ? Number(minuto) : 0
    );
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const dataIso = new Date(texto);
  return Number.isNaN(dataIso.getTime()) ? null : dataIso;
}

function processarCards(edges, agora) {
  return (edges || [])
    .map(({ node }) => {
      const normalizado = normalizarCampos(node.fields || []);
      const horarioDate = parseHorarioVisita(normalizado.visita_horario);
      return {
        id: node.id,
        nomeResponsavel: normalizado.responsavel_1_nome || node.title || '',
        nomeAluno: normalizado.nome_aluno_1 || '',
        horario: normalizado.visita_horario || null,
        chegando: horarioDate ? Math.abs(horarioDate.getTime() - agora) <= JANELA_CHEGANDO_MS : false,
        _horarioTs: horarioDate ? horarioDate.getTime() : null,
      };
    })
    .sort((a, b) => {
      if (a._horarioTs === null && b._horarioTs === null) return 0;
      if (a._horarioTs === null) return 1;
      if (b._horarioTs === null) return -1;
      return a._horarioTs - b._horarioTs;
    })
    .map(({ _horarioTs, ...card }) => card);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'metodo_nao_permitido' });
    return;
  }

  const sessao = verifySession(req);
  if (!sessao) {
    res.status(401).json({ error: 'nao_autenticado' });
    return;
  }

  const faseAgendouId = (process.env.PIPEFY_FASE_AGENDOU_VISITA_ID || '').trim();

  if (!faseAgendouId) {
    console.error('[visitas/agenda-completa] fase nao configurada');
    res.status(502).json({ error: 'Fase não configurada no servidor. Avisar o responsável.' });
    return;
  }

  let data;
  try {
    data = await pipefyRequest(QUERY, { faseAgendouId });
  } catch (err) {
    console.error('[visitas/agenda-completa] erro ao consultar Pipefy', err && err.code, err && err.message);
    res.status(502).json({ error: mensagemErroPipefy(err) });
    return;
  }

  const faseAgendou = data && data.phase;

  if (!faseAgendou) {
    console.error('[visitas/agenda-completa] fase nao encontrada', faseAgendouId);
    res.status(502).json({ error: 'Fase não encontrada no Pipefy. Avisar o responsável.' });
    return;
  }

  const agora = Date.now();
  const allEdges = (faseAgendou.cards && faseAgendou.cards.edges) || [];
  const allCards = processarCards(allEdges, agora);

  // Separar em proximas (data/hora futura) e encerradas (data/hora passada)
  const proximas = [];
  const encerradas = [];

  allCards.forEach(card => {
    const horarioDate = parseHorarioVisita(card.horario);
    if (horarioDate && horarioDate.getTime() < agora) {
      encerradas.push(card);
    } else {
      proximas.push(card);
    }
  });

  console.log('[visitas/agenda-completa] proximas:', proximas.length, 'encerradas:', encerradas.length);

  res.status(200).json({ proximas, encerradas });
};
