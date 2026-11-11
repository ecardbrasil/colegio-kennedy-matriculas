// agenda.js
// Carrega e renderiza a agenda de visitas (index.html), em lista ou calendário.
// Alem do carregamento inicial, a lista e recarregada pelo botao "Atualizar"
// e quando a aba volta a ficar visivel: no tablet o Diego alterna entre este
// tool e o Pipefy, e antes disso a agenda ficava congelada no estado de quando
// a pagina foi aberta (foi a causa de um "nenhuma visita agendada" com o card
// ja na fase "7. AGENDOU VISITA", ver HISTORICO.md).

(function () {
  var listaAgenda = document.getElementById('listaAgenda');
  var calendarioAgenda = document.getElementById('calendarioAgenda');
  var mensagemCarregando = document.getElementById('mensagemCarregando');
  var mensagemVazia = document.getElementById('mensagemVazia');
  var mensagemErroTela = document.getElementById('mensagemErroTela');
  var textoErroCarregamento = document.getElementById('textoErroCarregamento');
  var btnTentarNovamente = document.getElementById('btnTentarNovamente');
  var btnAtualizar = document.getElementById('btnAtualizar');
  var btnSair = document.getElementById('btnSair');
  var abaProximas = document.getElementById('abaProximas');
  var abaEncerradas = document.getElementById('abaEncerradas');
  var visaoLista = document.getElementById('visaoLista');
  var visaoCalendario = document.getElementById('visaoCalendario');

  var MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar a agenda. Verifique a internet.';
  var CHAVE_VISAO = 'visitas_visao';
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CABECALHO_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  var carregando = false;
  var abaAtiva = 'proximas';
  var visao = 'lista';
  var dadosAgenda = { proximas: [], encerradas: [] };
  var mesExibido = null;
  var diaSelecionado = null;

  // O campo "visita" do Pipefy chega como "DD/MM/AAAA HH:MM", que o `new Date`
  // do navegador nao entende (nao e ISO): trata esse padrao primeiro e so
  // depois tenta o parse generico.
  function formatarDataHora(valorBruto) {
    if (valorBruto === null || valorBruto === undefined || valorBruto === '') return '';
    var texto = String(valorBruto).trim();

    var partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
    if (partes) {
      var dataCurta = partes[1] + '/' + partes[2] + '/' + partes[3];
      return partes[4] ? dataCurta + ', ' + partes[4] + ':' + partes[5] : dataCurta;
    }

    var data = new Date(texto);
    if (isNaN(data.getTime())) return texto;
    var dia = String(data.getDate()).padStart(2, '0');
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var ano = data.getFullYear();
    var horas = String(data.getHours()).padStart(2, '0');
    var minutos = String(data.getMinutes()).padStart(2, '0');
    return dia + '/' + mes + '/' + ano + ', ' + horas + ':' + minutos;
  }

  // Dia da visita no formato AAAA-MM-DD, para o calendário. Null se não der para ler.
  function diaDaVisita(valorBruto) {
    if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;
    var texto = String(valorBruto).trim();

    var partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (partes) return partes[3] + '-' + partes[2] + '-' + partes[1];

    var data = new Date(texto);
    if (isNaN(data.getTime())) return null;
    return isoDoDia(data);
  }

  function isoDoDia(data) {
    return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
  }

  function criarItemAgenda(visita, ehEncerrada) {
    var container = document.createElement('li');
    container.className = 'item-agenda-container';

    var item = document.createElement('a');
    item.href = '/visitas/card.html?id=' + encodeURIComponent(visita.id);
    item.className = 'item-agenda' + (visita.chegando ? ' chegando' : '');

    var badge = '';
    if (visita.chegando) {
      badge = '<span class="badge-chegando">Chegando agora</span>';
    }

    item.innerHTML =
      badge +
      '<div class="horario">' + formatarDataHora(visita.horario) + '</div>' +
      '<div class="nome-responsavel">' + escapeHtml(visita.nomeResponsavel || 'Responsável não informado') + '</div>' +
      '<div class="nome-aluno">Aluno: ' + escapeHtml(visita.nomeAluno || 'Não informado') + '</div>' +
      (visita.divergente
        ? '<div class="aviso-divergente">Atenção: o vencimento no Pipefy é ' + escapeHtml(formatarDataHora(visita.vencimento).split(',')[0]) +
          ', diferente do horário acima. Se a visita foi remarcada, toque em Remarcar.</div>'
        : '');

    container.appendChild(item);

    // Toque unico, sem confirmacao: o card some na hora e aparece um aviso
    // com "Desfazer" (balcao de atendimento: rapido e com rede de seguranca).
    var botoes = document.createElement('div');
    botoes.className = 'item-agenda-acoes';
    var emAndamento = window.cronometro && window.cronometro.atual() && window.cronometro.atual().id === String(visita.id);
    var htmlIniciar = ehEncerrada ? '' :
      '<button type="button" class="acao acao-iniciar' + (emAndamento ? ' acao-andamento' : '') + '" data-acao="iniciar">' +
        (emAndamento ? 'Em andamento' : 'Iniciar') + '</button>';
    botoes.innerHTML = htmlIniciar +
      '<button type="button" class="acao acao-remarcar" data-acao="remarcar">Remarcar</button>' +
      '<button type="button" class="acao acao-nao-veio" data-acao="nao-veio">Não veio</button>' +
      '<button type="button" class="acao acao-fez" data-acao="fez">Fez visita</button>';
    container.appendChild(botoes);

    botoes.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-acao]');
      if (!btn) return;
      var acao = btn.getAttribute('data-acao');
      if (acao === 'remarcar') {
        abrirRemarcar(visita, container);
        return;
      }
      if (acao === 'iniciar') {
        if (window.cronometro && !emAndamento && window.cronometro.iniciar(visita.id, visita.nomeResponsavel)) {
          renderizarVisao();
        }
        return;
      }
      moverRapido(visita, container, acao === 'fez' ? FASE_FEZ : FASE_NAO_VEIO, acao === 'fez' ? 'Fez visita' : 'Não veio');
    });

    return container;
  }

  // "17/09/2026 13:50" -> "2026-09-17T13:50" (formato do input datetime-local).
  function paraDatetimeLocal(valorBruto) {
    if (!valorBruto) return '';
    var t = String(valorBruto).trim();
    var br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
    if (br) return br[3] + '-' + br[2] + '-' + br[1] + 'T' + (br[4] || '09') + ':' + (br[5] || '00');
    var iso = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    return iso ? iso[1] + '-' + iso[2] + '-' + iso[3] + 'T' + iso[4] + ':' + iso[5] : '';
  }

  // ===== Remarcar: grava "Dia e Horario da Visita" (o campo que a tela le) =====
  function abrirRemarcar(visita, container) {
    var existente = container.querySelector('.painel-remarcar');
    if (existente) { existente.remove(); return; }

    var painel = document.createElement('div');
    painel.className = 'painel-remarcar';
    painel.innerHTML =
      '<label>Novo dia e horário</label>' +
      '<input type="datetime-local" step="900">' +
      '<button type="button" class="acao acao-fez">Salvar</button>' +
      '<small>Só muda no Pipefy. O evento no Google Calendar continua sendo movido à mão.</small>';
    var campo = painel.querySelector('input');
    campo.value = paraDatetimeLocal(visita.divergente ? visita.vencimento : visita.horario) || paraDatetimeLocal(visita.horario);
    var salvar = painel.querySelector('button');
    salvar.addEventListener('click', function () {
      if (!campo.value) return;
      salvar.disabled = true;
      salvar.textContent = 'Salvando...';
      fetchAutenticado('/api/visitas/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: visita.id, fields: { visita_horario: campo.value } }),
      }).then(function (res) {
        if (res.ok) return res.json();
        return window.mensagemErroResposta(res, 'Não foi possível remarcar.').then(function (m) { throw new Error(m); });
      }).then(function () {
        mostrarToast((visita.nomeResponsavel || 'Visita') + ': remarcada');
        carregarAgenda({ silencioso: true });
      }).catch(function (erro) {
        salvar.disabled = false;
        salvar.textContent = 'Salvar';
        mostrarToast('Falhou: ' + (erro && erro.message ? erro.message : 'sem conexão') + ' Tente de novo.');
      });
    });
    container.appendChild(painel);
  }

  // ===== Acoes de toque unico =====
  var FASE_AGENDOU = '343928415';
  var FASE_NAO_VEIO = '343928419';
  var FASE_FEZ = '343928427';
  var toastTimer = null;

  function removerDasListas(id) {
    dadosAgenda.proximas = dadosAgenda.proximas.filter(function (v) { return v.id !== id; });
    dadosAgenda.encerradas = dadosAgenda.encerradas.filter(function (v) { return v.id !== id; });
  }

  function mostrarToast(texto, aoDesfazer) {
    var toast = document.getElementById('toastAgenda');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastAgenda';
      toast.className = 'toast-agenda';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span></span>' + (aoDesfazer ? '<button type="button">Desfazer</button>' : '');
    toast.firstChild.textContent = texto;
    toast.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('visivel'); }, 7000);
    var b = toast.querySelector('button');
    if (b) b.addEventListener('click', function () {
      toast.classList.remove('visivel');
      aoDesfazer();
    });
  }

  function chamarMover(cardId, fase) {
    return fetchAutenticado('/api/visitas/mover-fase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: cardId, destinyPhaseId: fase }),
    }).then(function (res) {
      if (res.ok) return res.json();
      return window.mensagemErroResposta(res, 'Erro ao mover visita').then(function (m) { throw new Error(m); });
    });
  }

  function moverRapido(visita, container, fase, rotulo) {
    var backupP = dadosAgenda.proximas.slice();
    var backupE = dadosAgenda.encerradas.slice();
    removerDasListas(visita.id);
    renderizarVisao();
    if (window.cronometro) window.cronometro.pararDe(visita.id);

    chamarMover(visita.id, fase).then(function () {
      mostrarToast((visita.nomeResponsavel || 'Visita') + ': ' + rotulo, function () {
        chamarMover(visita.id, FASE_AGENDOU)
          .then(function () { carregarAgenda({ silencioso: true }); })
          .catch(function () { mostrarToast('Não consegui desfazer. Mover no Pipefy.'); });
      });
    }).catch(function (erro) {
      dadosAgenda = { proximas: backupP, encerradas: backupE };
      renderizarVisao();
      mostrarToast('Falhou: ' + (erro && erro.message ? erro.message : 'sem conexão') + ' Tente de novo.');
    });
  }


  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function mostrarErro(mensagem) {
    mensagemCarregando.hidden = true;
    mensagemVazia.hidden = true;
    mensagemErroTela.hidden = false;
    textoErroCarregamento.textContent = mensagem || MENSAGEM_ERRO_PADRAO;
  }

  function moverCardParaFase(cardId, phaseId) {
    var btn = document.querySelector('[data-card-id="' + cardId + '"][data-phase="' + phaseId + '"]');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Movendo...';

    fetchAutenticado('/api/visitas/mover-fase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: cardId, destinyPhaseId: phaseId }),
    })
      .then(function (res) {
        if (res.ok) return res.json();
        return window.mensagemErroResposta(res, 'Erro ao mover visita').then(function (mensagem) {
          throw new Error(mensagem);
        });
      })
      .then(function () {
        carregarAgenda({ silencioso: true });
      })
      .catch(function (erro) {
        console.error('[visitas/agenda] erro ao mover card', erro && erro.message);
        btn.disabled = false;
        btn.textContent = btn.classList.contains('btn-nao-veio') ? 'Não veio' : 'Fez visita';
        alert('Não foi possível mover a visita. Tente novamente.');
      });
  }

  function visitasDaAba() {
    return abaAtiva === 'proximas' ? dadosAgenda.proximas : dadosAgenda.encerradas;
  }

  // ===== Visão de lista =====
  function renderizarLista(visitas, ehEncerrada, mensagemSemVisitas) {
    listaAgenda.innerHTML = '';

    if (!visitas || visitas.length === 0) {
      mensagemVazia.textContent = mensagemSemVisitas;
      mensagemVazia.hidden = false;
      return;
    }

    mensagemVazia.hidden = true;
    visitas.forEach(function (visita) {
      listaAgenda.appendChild(criarItemAgenda(visita, ehEncerrada));
    });
  }

  // ===== Visão de calendário (mesmo visual do agendar-visita) =====
  function garantirSelecao(visitas) {
    if (!mesExibido) {
      var agora = new Date();
      mesExibido = new Date(agora.getFullYear(), agora.getMonth(), 1);
    }
    if (diaSelecionado) return;

    var hoje = isoDoDia(new Date());
    var dias = visitas.map(function (v) { return diaDaVisita(v.horario); }).filter(Boolean).sort();
    if (dias.indexOf(hoje) >= 0) diaSelecionado = hoje;
    else if (dias.length) diaSelecionado = dias[0];
    else diaSelecionado = hoje;

    var partes = diaSelecionado.split('-');
    mesExibido = new Date(Number(partes[0]), Number(partes[1]) - 1, 1);
  }

  // Desenha o mês e devolve as visitas do dia selecionado.
  function renderizarCalendario(visitas) {
    garantirSelecao(visitas);

    var ano = mesExibido.getFullYear();
    var mes = mesExibido.getMonth();
    var hoje = isoDoDia(new Date());

    var contagem = {};
    visitas.forEach(function (v) {
      var dia = diaDaVisita(v.horario);
      if (dia) contagem[dia] = (contagem[dia] || 0) + 1;
    });

    var offset = (new Date(ano, mes, 1).getDay() + 6) % 7;
    var totalDias = new Date(ano, mes + 1, 0).getDate();

    var html =
      '<div class="cal-cabecalho">' +
        '<button type="button" class="cal-nav" data-mes="-1" aria-label="Mês anterior">&lsaquo;</button>' +
        '<h2>' + MESES[mes] + ' de ' + ano + '</h2>' +
        '<button type="button" class="cal-nav" data-mes="1" aria-label="Próximo mês">&rsaquo;</button>' +
      '</div>';

    html += '<div class="cal-semana">' + CABECALHO_SEMANA.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>';
    html += '<div class="cal-grade">';
    for (var k = 0; k < offset; k++) html += '<div class="cal-dia cal-dia--vazio"></div>';

    for (var n = 1; n <= totalDias; n++) {
      var iso = ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0');
      var qtd = contagem[iso] || 0;
      var classes = 'cal-dia' + (iso === hoje ? ' cal-dia--hoje' : '') + (iso === diaSelecionado ? ' cal-dia--sel' : '');
      if (qtd) {
        html += '<button type="button" class="' + classes + ' cal-dia--com-visita" data-dia="' + iso + '">' +
          '<span>' + n + '</span>' +
          '<span class="cal-qtd">' + qtd + (qtd === 1 ? ' visita' : ' visitas') + '</span>' +
        '</button>';
      } else {
        html += '<div class="' + classes + '"><span>' + n + '</span></div>';
      }
    }
    html += '</div>';

    var partes = diaSelecionado.split('-');
    html += '<p class="cal-dia-titulo">Visitas de ' + partes[2] + '/' + partes[1] + '/' + partes[0] + '</p>';
    calendarioAgenda.innerHTML = html;

    return visitas.filter(function (v) { return diaDaVisita(v.horario) === diaSelecionado; });
  }

  function renderizarVisao() {
    mensagemCarregando.hidden = true;
    mensagemErroTela.hidden = true;

    var visitas = visitasDaAba();
    var ehEncerrada = abaAtiva === 'encerradas';

    if (visao === 'calendario') {
      calendarioAgenda.hidden = false;
      var doDia = renderizarCalendario(visitas);
      renderizarLista(doDia, ehEncerrada, 'Nenhuma visita neste dia.');
    } else {
      calendarioAgenda.hidden = true;
      renderizarLista(visitas, ehEncerrada, 'Nenhuma visita nesta categoria.');
    }
  }

  function definirVisao(nova) {
    visao = nova;
    visaoLista.classList.toggle('ativa', nova === 'lista');
    visaoCalendario.classList.toggle('ativa', nova === 'calendario');
    visaoLista.setAttribute('aria-pressed', String(nova === 'lista'));
    visaoCalendario.setAttribute('aria-pressed', String(nova === 'calendario'));
    try { localStorage.setItem(CHAVE_VISAO, nova); } catch (e) {}
    renderizarVisao();
  }

  // `silencioso` evita o flash de "Carregando agenda..." e o sumico da lista
  // quando a recarga acontece sozinha.
  function carregarAgenda(opcoes) {
    var silencioso = !!(opcoes && opcoes.silencioso);

    if (carregando) return Promise.resolve();
    carregando = true;

    if (!silencioso) {
      mensagemCarregando.hidden = false;
      mensagemVazia.hidden = true;
      mensagemErroTela.hidden = true;
      listaAgenda.innerHTML = '';
      calendarioAgenda.innerHTML = '';
    }

    return fetchAutenticado('/api/visitas/agenda-completa')
      .then(function (res) {
        if (res.ok) return res.json();
        // Mostra o motivo que a API mandou (ex.: token do Pipefy invalido) em
        // vez de dizer que nao ha visita quando o problema e de configuracao.
        return window.mensagemErroResposta(res, MENSAGEM_ERRO_PADRAO).then(function (mensagem) {
          throw new Error(mensagem);
        });
      })
      .then(function (dados) {
        dadosAgenda = dados;
        renderizarVisao();
      })
      .catch(function (erro) {
        if (erro && erro.message === 'nao_autenticado') return;
        console.error('[visitas/agenda] falha ao carregar', erro && erro.message);
        mostrarErro(erro && erro.message);
      })
      .finally(function () {
        carregando = false;
      });
  }

  calendarioAgenda.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-mes]');
    if (nav) {
      var passo = Number(nav.getAttribute('data-mes'));
      mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + passo, 1);
      renderizarVisao();
      return;
    }
    var dia = e.target.closest('[data-dia]');
    if (dia) {
      diaSelecionado = dia.getAttribute('data-dia');
      var partes = diaSelecionado.split('-');
      mesExibido = new Date(Number(partes[0]), Number(partes[1]) - 1, 1);
      renderizarVisao();
    }
  });

  visaoLista.addEventListener('click', function () { definirVisao('lista'); });
  visaoCalendario.addEventListener('click', function () { definirVisao('calendario'); });

  btnTentarNovamente.addEventListener('click', function () {
    carregarAgenda();
  });

  if (btnAtualizar) {
    btnAtualizar.addEventListener('click', function () {
      carregarAgenda();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      carregarAgenda({ silencioso: true });
    }
  });

  btnSair.addEventListener('click', function () {
    fetch('/api/visitas/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(function () {})
      .then(function () {
        window.location.href = '/visitas/login.html';
      });
  });

  abaProximas.addEventListener('click', function () {
    abaAtiva = 'proximas';
    abaProximas.classList.add('ativa');
    abaEncerradas.classList.remove('ativa');
    diaSelecionado = null;
    renderizarVisao();
  });

  abaEncerradas.addEventListener('click', function () {
    abaAtiva = 'encerradas';
    abaEncerradas.classList.add('ativa');
    abaProximas.classList.remove('ativa');
    diaSelecionado = null;
    renderizarVisao();
  });

  var visaoSalva = null;
  try { visaoSalva = localStorage.getItem(CHAVE_VISAO); } catch (e) {}
  definirVisao(visaoSalva === 'calendario' ? 'calendario' : 'lista');

  carregarAgenda();
  setInterval(function () {
    if (document.visibilityState === 'visible') carregarAgenda({ silencioso: true });
  }, 30000);
  window.addEventListener('cronometro:mudou', renderizarVisao);
})();
