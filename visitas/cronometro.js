// cronometro.js
// Cronometro da visita em andamento. Aparece logo abaixo do topo nas telas de
// visita (index e card), para o Diego ver o tempo sem sair da tela.
// Fica so no navegador do tablet (localStorage): nao vai para o Pipefy.
// Uma visita por vez (regra da Central).

(function () {
  var CHAVE = 'visitas_cronometro';
  var META_MS = 45 * 60 * 1000; // duracao da visita: 45 min
  var barra = null;
  var timer = null;

  function ler() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      var dado = bruto ? JSON.parse(bruto) : null;
      return dado && dado.id && dado.inicio ? dado : null;
    } catch (e) { return null; }
  }

  function gravar(dado) {
    try {
      if (dado) localStorage.setItem(CHAVE, JSON.stringify(dado));
      else localStorage.removeItem(CHAVE);
    } catch (e) {}
  }

  function formatar(ms) {
    var total = Math.floor(Math.abs(ms) / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function ajustarPosicao() {
    var topo = document.querySelector('header.topo');
    if (barra && topo) barra.style.top = topo.offsetHeight + 'px';
  }

  function montarBarra() {
    if (barra) return;
    barra = document.createElement('div');
    barra.className = 'cronometro-barra';
    barra.id = 'cronometroBarra';
    barra.hidden = true;
    barra.innerHTML =
      '<div class="cronometro-info">' +
        '<span class="cronometro-rotulo">Visita em andamento</span>' +
        '<span class="cronometro-nome"></span>' +
      '</div>' +
      '<div class="cronometro-tempo"></div>' +
      '<div class="cronometro-meta"></div>' +
      '<button type="button" class="cronometro-encerrar">Encerrar</button>';
    barra.querySelector('.cronometro-encerrar').addEventListener('click', encerrar);

    var topo = document.querySelector('header.topo');
    if (topo) topo.insertAdjacentElement('afterend', barra);
    else document.body.insertBefore(barra, document.body.firstChild);

    ajustarPosicao();
    window.addEventListener('resize', ajustarPosicao);
  }

  function pararTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function ligarTimer() {
    if (!timer) timer = setInterval(atualizar, 1000);
  }

  function atualizar() {
    var dado = ler();
    if (!dado) {
      if (barra) barra.hidden = true;
      pararTimer();
      return;
    }
    montarBarra();
    barra.hidden = false;
    // Calcula pelo horario de inicio, nao por contagem: o tempo segue certo
    // mesmo se o navegador pausar o timer (aba em segundo plano, tela bloqueada).
    var decorrido = Date.now() - dado.inicio;
    var passou = decorrido > META_MS;
    barra.querySelector('.cronometro-nome').textContent = dado.nome || 'Responsável não informado';
    barra.querySelector('.cronometro-tempo').textContent = formatar(decorrido);
    barra.querySelector('.cronometro-meta').textContent = passou
      ? 'Passou ' + formatar(decorrido - META_MS) + ' da meta de 45 min'
      : 'Faltam ' + formatar(META_MS - decorrido) + ' para 45 min';
    barra.classList.toggle('passou-meta', passou);
  }

  function avisarMudanca() {
    window.dispatchEvent(new Event('cronometro:mudou'));
  }

  function iniciar(id, nome) {
    var atual = ler();
    if (atual && atual.id === String(id)) return true;
    if (atual && !confirm('Já tem visita em andamento (' + (atual.nome || 'sem nome') + '). Trocar pela de ' + (nome || 'sem nome') + '?')) return false;
    gravar({ id: String(id), nome: nome || '', inicio: Date.now() });
    atualizar();
    ligarTimer();
    avisarMudanca();
    return true;
  }

  function encerrar() {
    var atual = ler();
    if (!atual) return;
    if (!confirm('Encerrar o cronômetro da visita de ' + (atual.nome || 'sem nome') + '?')) return;
    gravar(null);
    atualizar();
    avisarMudanca();
  }

  // Outra aba ou tela do mesmo tablet mudou o cronometro.
  window.addEventListener('storage', function (e) {
    if (e.key !== CHAVE) return;
    atualizar();
    if (ler()) ligarTimer();
    avisarMudanca();
  });

  window.cronometro = { iniciar: iniciar, encerrar: encerrar, atual: ler };

  atualizar();
  if (ler()) ligarTimer();
})();
