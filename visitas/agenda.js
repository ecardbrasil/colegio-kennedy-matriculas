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

  var MENSAGEM_ERRO_PADRAO = 'Não foi possível carregar a agenda. Verifique a internet.';
  var carregando = false;

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

  function criarItemAgenda(visita) {
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

    return item;
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

  function renderizarLista(visitas) {
    mensagemCarregando.hidden = true;
    mensagemErroTela.hidden = true;
    listaAgenda.innerHTML = '';

    if (!visitas || visitas.length === 0) {
      mensagemVazia.hidden = false;
      return;
    }

    mensagemVazia.hidden = true;
    visitas.forEach(function (visita) {
      listaAgenda.appendChild(criarItemAgenda(visita));
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

    return fetchAutenticado('/api/visitas/agenda')
      .then(function (res) {
        if (res.ok) return res.json();
        // Mostra o motivo que a API mandou (ex.: token do Pipefy invalido) em
        // vez de dizer que nao ha visita quando o problema e de configuracao.
        return window.mensagemErroResposta(res, MENSAGEM_ERRO_PADRAO).then(function (mensagem) {
          throw new Error(mensagem);
        });
      })
      .then(renderizarLista)
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

  carregarAgenda();
})();
