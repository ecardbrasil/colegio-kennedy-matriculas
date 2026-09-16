// agenda.js
// Carrega e renderiza a lista de visitas agendadas (index.html).

(function () {
  var listaAgenda = document.getElementById('listaAgenda');
  var mensagemCarregando = document.getElementById('mensagemCarregando');
  var mensagemVazia = document.getElementById('mensagemVazia');
  var mensagemErroTela = document.getElementById('mensagemErroTela');
  var btnTentarNovamente = document.getElementById('btnTentarNovamente');
  var btnSair = document.getElementById('btnSair');

  function formatarDataHora(isoString) {
    var data = new Date(isoString);
    if (isNaN(data.getTime())) return isoString;
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

  function mostrarErro() {
    mensagemCarregando.hidden = true;
    mensagemVazia.hidden = true;
    mensagemErroTela.hidden = false;
  }

  function carregarAgenda() {
    mensagemCarregando.hidden = false;
    mensagemVazia.hidden = true;
    mensagemErroTela.hidden = true;
    listaAgenda.innerHTML = '';

    fetchAutenticado('/api/visitas/agenda')
      .then(function (res) {
        if (!res.ok) throw new Error('erro_agenda');
        return res.json();
      })
      .then(function (visitas) {
        mensagemCarregando.hidden = true;
        if (!visitas || visitas.length === 0) {
          mensagemVazia.hidden = false;
          return;
        }
        visitas.forEach(function (visita) {
          listaAgenda.appendChild(criarItemAgenda(visita));
        });
      })
      .catch(function (erro) {
        if (erro && erro.message === 'nao_autenticado') return;
        mostrarErro();
      });
  }

  btnTentarNovamente.addEventListener('click', carregarAgenda);

  btnSair.addEventListener('click', function () {
    fetch('/api/visitas/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(function () {})
      .then(function () {
        window.location.href = '/visitas/login.html';
      });
  });

  carregarAgenda();
})();
