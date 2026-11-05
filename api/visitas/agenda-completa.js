// GET -> cards da fase "7. AGENDOU VISITA", separados em proximas e encerradas.
// Proximas: data/hora ainda não passou. Encerradas: data/hora já passou.
// Exige sessao valida. Retorna payload com arrays { proximas, encerradas }.

const { verifySession } = require('./_lib/session');
const { mensagemErroPipefy } = require('./_lib/pipefy');
const { buscarCardsDaFase, processarCards } = require('./_lib/agenda');

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
    data = await buscarCardsDaFase(faseAgendouId);
  } catch (err) {
    console.error('[visitas/agenda-completa] erro ao consultar Pipefy', err && err.code, err && err.message);
    res.status(502).json({ error: mensagemErroPipefy(err) });
    return;
  }

  const faseAgendou = data && data.fase;

  if (!faseAgendou) {
    console.error('[visitas/agenda-completa] fase nao encontrada', faseAgendouId);
    res.status(502).json({ error: 'Fase não encontrada no Pipefy. Avisar o responsável.' });
    return;
  }

  const agora = Date.now();
  const allCards = processarCards(data.edges, agora);

  // Separar em proximas (data/hora futura) e encerradas (data/hora passada)
  const proximas = [];
  const encerradas = [];

  allCards.forEach(({ _horarioTs, ...card }) => {
    if (_horarioTs !== null && _horarioTs < agora) {
      encerradas.push(card);
    } else {
      proximas.push(card);
    }
  });

  console.log('[visitas/agenda-completa] proximas:', proximas.length, 'encerradas:', encerradas.length);

  res.status(200).json({ proximas, encerradas });
};
