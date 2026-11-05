// GET -> cards da fase "7. AGENDOU VISITA", ordenados por data/hora da
// visita. Exige sessao valida. Retorna um payload enxuto pronto pra UI
// (tablet-first), nunca o blob bruto de fields do Pipefy.

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

  // `.trim()` porque espaco ou aspas vindos de copy-paste no dashboard da
  // Vercel fazem o Pipefy responder "Acesso negado" numa fase que existe.
  const phaseId = (process.env.PIPEFY_FASE_AGENDOU_VISITA_ID || '').trim();
  if (!phaseId) {
    console.error('[visitas/agenda] PIPEFY_FASE_AGENDOU_VISITA_ID nao configurado');
    res.status(502).json({ error: 'Fase da agenda não configurada no servidor. Avisar o responsável.' });
    return;
  }

  let data;
  try {
    data = await buscarCardsDaFase(phaseId);
  } catch (err) {
    console.error('[visitas/agenda] erro ao consultar Pipefy', err && err.code, err && err.message);
    res.status(502).json({ error: mensagemErroPipefy(err) });
    return;
  }

  const fase = data && data.fase;
  if (!fase) {
    // Antes isso virava `|| []`, ou seja: problema de configuracao aparecia na
    // tela como "Nenhuma visita agendada no momento." (ver _lib/pipefy.js).
    console.error('[visitas/agenda] fase nao encontrada no Pipefy', phaseId);
    res.status(502).json({ error: 'Fase da agenda não encontrada no Pipefy. Avisar o responsável.' });
    return;
  }

  // Sanidade da configuracao: se o ID apontar para outra etapa por engano, o
  // log deixa isso explicito em vez de entregar uma agenda vazia.
  if (fase.name && !/visita/i.test(fase.name)) {
    console.error('[visitas/agenda] fase configurada nao parece ser a de visitas', fase.id, fase.name);
  }

  const agora = Date.now();
  console.log('[visitas/agenda] fase', fase.id, `"${fase.name}"`, '->', data.edges.length, 'card(s)');

  const cards = processarCards(data.edges, agora).map(({ _horarioTs, ...card }) => card);

  res.status(200).json(cards);
};
