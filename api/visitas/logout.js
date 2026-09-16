// POST -> limpa o cookie de sessao (visitas_session).

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'metodo_nao_permitido' });
    return;
  }

  res.setHeader(
    'Set-Cookie',
    'visitas_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  );
  res.status(200).json({ ok: true });
};
