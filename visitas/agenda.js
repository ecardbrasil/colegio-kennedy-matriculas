// agenda.js
// Carrega e renderiza a lista de visitas agendadas (index.html).
// Alem do carregamento inicial, a lista e recarregada pelo botao "Atualizar"
// e quando a aba volta a ficar visivel: no tablet o Diego alterna entre este
// tool e o Pipefy, e antes disso a agenda ficava congelada no estado de quando
// a pagina foi aberta (foi a causa de um "nenhuma visita agendada" com o card
// ja na fase "7. AGENDOU VISITA", ver HISTORICO.md).

(function () {
  var listaAgenda = document.getElementById('listaAgenda');
  var mensagemCarregando = document.getElementById('mensagemCarregando');
  var mensagemVazia = document.getElementById('mensagemVazia');
  var mensagemErroTela = document.getElementById('mensagemErroTela');
  var textoErroCarregamento = document.getElementById('textoErroCarregamento');
  var btnTentarNovamente = document.getElementById('btnTentarNovamente');
  var btnAtualizar = document.getElementById('btnAtualizar');
  var btnSair = document.getElementById('btnSair');
  var abaProximas = document.getElementById('abaProximas');
  var abaEncerradas = document.getElementById('abaEncerradas');

  var MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar a agenda. Verifique a internet.';
  var carregando = false;
  var abaAtiva = 'proximas';
  var dadosAgenda = { proximas: [], encerradas: [] };

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

  // Slider para iniciar a visita: a pessoa precisa arrastar até o fim,
  // assim um toque sem querer não começa o cronômetro.
  function criarSlider(visita) {
    var trilho = document.createElement('div');
    trilho.className = 'slider-iniciar';
    trilho.innerHTML =
      '<span class="slider-texto">Deslize para iniciar visita</span>' +
      '<div class="slider-botao" role="button" tabindex="0" aria-label="Deslize para iniciar visita">&rsaquo;</div>';
    var botao = trilho.querySelector('.slider-botao');
    var arrastando = false;
    var inicioX = 0;
    var deslocamento = 0;
    var maximo = 0;

    function medir() {
      maximo = trilho.clientWidth - botao.offsetWidth - 8;
    }

    function mover(x) {
      deslocamento = Math.max(0, Math.min(x, maximo));
      botao.style.transform = 'translateX(' + deslocamento + 'px)';
    }

    function iniciarVisita() {
      medir();
      mover(maximo);
      var ok = window.cronometro.iniciar(visita.id, visita.nomeResponsavel);
      if (!ok) mover(0);
    }

    botao.addEventListener('pointerdown', function (e) {
      medir();
      arrastando = true;
      inicioX = e.clientX - deslocamento;
      trilho.classList.add('arrastando');
      botao.setPointerCapture(e.pointerId);
    });

    botao.addEventListener('pointermove', function (e) {
      if (arrastando) mover(e.clientX - inicioX);
    });

    function soltar() {
      if (!arrastando) return;
      arrastando = false;
      trilho.classList.remove('arrastando');
      if (deslocamento >= maximo * 0.9) iniciarVisita();
      else mover(0);
    }

    botao.addEventListener('pointerup', soltar);
    botao.addEventListener('pointercancel', soltar);

    botao.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        iniciarVisita();
      }
    });

    return trilho;
  }

  // Cada card fica em duas colunas: dados da visita à esquerda, ações à direita.
  function criarItemAgenda(visita, ehEncerrada) {
    var container = document.createElement('li');
    container.className = 'item-agenda-container';

    var linha = document.createElement('div');
    linha.className = 'item-agenda-linha';

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
      '<div class="nome-aluno">Aluno: ' + escapeHtml(visita.nomeAluno || 'Não informado') + '</div>';

    linha.appendChild(item);

    var acoes = document.createElement('div');
    acoes.className = 'item-agenda-acoes';

    if (ehEncerrada) {
      acoes.innerHTML =
        '<button type="button" class="btn-acao btn-nao-veio" data-card-id="' + escapeHtml(visita.id) + '" data-phase="343928419">Não veio</button>' +
        '<button type="button" class="btn-acao btn-fez-visita" data-card-id="' + escapeHtml(visita.id) + '" data-phase="343928427">Fez visita</button>';

      Array.from(acoes.querySelectorAll('.btn-acao')).forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          moverCardParaFase(btn.dataset.cardId, btn.dataset.phase);
        });
      });
    } else {
      // Uma visita por vez: a que está no cronômetro mostra "Em andamento" no lugar do slider.
      var emAndamento = window.cronometro && window.cronometro.atual();
      if (emAndamento && emAndamento.id === String(visita.id)) {
        acoes.innerHTML = '<div class="em-andamento">Em andamento</div>';
      } else {
        acoes.appendChild(criarSlider(visita));
      }
    }

    linha.appendChild(acoes);
    container.appendChild(linha);

    return container;
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

  function renderizarLista() {
    mensagemCarregando.hidden = true;
    mensagemErroTela.hidden = true;
    listaAgenda.innerHTML = '';

    var visitas = abaAtiva === 'proximas' ? dadosAgenda.proximas : dadosAgenda.encerradas;
    var ehEncerrada = abaAtiva === 'encerradas';

    if (!visitas || visitas.length === 0) {
      mensagemVazia.hidden = false;
      return;
    }

    mensagemVazia.hidden = true;
    visitas.forEach(function (visita) {
      listaAgenda.appendChild(criarItemAgenda(visita, ehEncerrada));
    });
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
        renderizarLista();
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
    renderizarLista();
  });

  abaEncerradas.addEventListener('click', function () {
    abaAtiva = 'encerradas';
    abaEncerradas.classList.add('ativa');
    abaProximas.classList.remove('ativa');
    renderizarLista();
  });

  window.addEventListener('cronometro:mudou', function () {
    renderizarLista();
  });

  carregarAgenda();
})();
