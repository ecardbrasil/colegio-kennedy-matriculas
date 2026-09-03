/* =============================================================
   COLÉGIO KENNEDY — main.js
   ============================================================= */

'use strict';

// ─── CONFIGURAÇÃO ────────────────────────────────────────────
const CONFIG = {
  // ⚠️  SUBSTITUIR pela URL real do webhook do Make
  WEBHOOK_URL: 'https://hook.us2.make.com/y8xbso3x3tz77mnn79whh9k7tk7vqhzb',
  WHATSAPP_NUMBER: '5551981246336',
};

// ─── INICIALIZAÇÃO ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  captureUrlParams();
  setupPhoneMask();
  setupForm();
  animateCounters();
  document.getElementById('anoAtual').textContent = new Date().getFullYear();
});

// ─── CAPTURA DE GCLID E UTMs ──────────────────────────────────
function captureUrlParams() {
  const params = new URLSearchParams(window.location.search);

  const keys = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  keys.forEach((key) => {
    const value = params.get(key) || '';

    // Salva no sessionStorage para persistir entre redirecionamentos leves
    if (value) {
      sessionStorage.setItem(key, value);
    }

    // Preenche o campo hidden correspondente (sessionStorage como fallback)
    const stored = value || sessionStorage.getItem(key) || '';
    const field = document.getElementById(`field_${key}`);
    if (field) field.value = stored;
  });
}

// ─── MÁSCARA DE TELEFONE ──────────────────────────────────────
function setupPhoneMask() {
  const tel = document.getElementById('telefone');
  if (!tel) return;

  tel.addEventListener('input', () => {
    let v = tel.value.replace(/\D/g, '');

    // Remove o "55" (código do país) colado/digitado por engano antes do DDD,
    // ex: usuário copia do WhatsApp "+55 51 98444-8344" -> "55519844483 44"
    if (v.length > 11 && v.startsWith('55')) {
      v = v.slice(2);
    }

    v = v.slice(0, 11);
    if (v.length <= 10) {
      // (00) 0000-0000
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) =>
        c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ''
      );
    } else {
      // (00) 00000-0000
      v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
        c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ''
      );
    }
    tel.value = v;
  });
}

// ─── FORMULÁRIO ───────────────────────────────────────────────
function setupForm() {
  const form      = document.getElementById('leadForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnRetry  = document.getElementById('btnRetry');

  if (!form) return;

  form.addEventListener('submit', handleSubmit);
  btnRetry?.addEventListener('click', () => {
    showView('form');
  });

  // Limpa erro individual ao digitar
  form.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => clearFieldError(el));
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  setSubmitting(true);

  const payload = buildPayload();

  try {
    const res = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    onSuccess(payload);
  } catch (err) {
    console.error('[Kennedy] Erro no envio:', err);
    onError();
  } finally {
    setSubmitting(false);
  }
}

function buildPayload() {
  const get = (id) => document.getElementById(id)?.value?.trim() ?? '';

  return {
    nome:         get('nome'),
    nome_aluno:   get('nome_aluno'),
    telefone:     get('telefone'),
    email:        get('email'),
    serie:        get('serie'),
    gclid:        get('field_gclid'),
    utm_source:   get('field_utm_source'),
    utm_medium:   get('field_utm_medium'),
    utm_campaign: get('field_utm_campaign'),
    utm_term:     get('field_utm_term'),
    utm_content:  get('field_utm_content'),
    timestamp:    new Date().toISOString(),
    page_url:     window.location.href,
  };
}

function onSuccess(payload) {
  showView('success');

  // Dispara evento de conversão no dataLayer (Google Tag Manager)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event:        'lead_form_submit',
    form_name:    'matriculas_kennedy',
    serie:        payload.serie,
    nome_aluno:   payload.nome_aluno,
    gclid:        payload.gclid,
    utm_source:   payload.utm_source,
    utm_medium:   payload.utm_medium,
    utm_campaign: payload.utm_campaign,
  });

  redirectToWhatsApp(payload);
}

function redirectToWhatsApp(payload) {
  const mensagem =
    `Olá, Diego, me chamo ${payload.nome}, vim através do site do colégio ` +
    `e gostaria de saber mais informações para ${payload.serie}.`;

  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;

  setTimeout(() => {
    window.location.href = url;
  }, 1500);
}

function onError() {
  showView('error');
}

// ─── ESTADOS DA UI ─────────────────────────────────────────────
function showView(view) {
  const form    = document.getElementById('leadForm');
  const success = document.getElementById('formSuccess');
  const error   = document.getElementById('formErrorState');

  form.hidden    = view !== 'form';
  success.hidden = view !== 'success';
  error.hidden   = view !== 'error';
}

function setSubmitting(loading) {
  const btn     = document.getElementById('btnSubmit');
  const txtNorm = btn?.querySelector('.btn-text');
  const txtLoad = btn?.querySelector('.btn-loading');

  if (!btn) return;

  btn.disabled      = loading;
  txtNorm.hidden    = loading;
  txtLoad.hidden    = !loading;
}

// ─── VALIDAÇÃO ────────────────────────────────────────────────
function validateForm() {
  let valid = true;

  const nome = document.getElementById('nome');
  if (!nome.value.trim() || nome.value.trim().split(' ').length < 2) {
    setFieldError(nome, 'Informe seu nome completo');
    valid = false;
  }

  const nomeAluno = document.getElementById('nome_aluno');
  if (!nomeAluno.value.trim()) {
    setFieldError(nomeAluno, 'Informe o nome do aluno');
    valid = false;
  }

  const tel = document.getElementById('telefone');
  const telRaw = tel.value.replace(/\D/g, '');
  if (!isValidPhone(telRaw)) {
    setFieldError(tel, 'Telefone inválido, verifique o DDD e o número');
    valid = false;
  }

  const email = document.getElementById('email');
  if (!isValidEmail(email.value.trim())) {
    setFieldError(email, 'E-mail inválido');
    valid = false;
  }

  const serie = document.getElementById('serie');
  if (!serie.value) {
    setFieldError(serie, 'Selecione uma série');
    valid = false;
  }

  return valid;
}

function isValidPhone(telRaw) {
  if (telRaw.length < 10 || telRaw.length > 11) return false;

  // Celular (11 dígitos): 3º dígito é sempre 9, e o 4º nunca é 0, 1 ou 2.
  if (telRaw.length === 11) {
    const primeiroDigito = telRaw[2];
    const segundoDigito  = telRaw[3];
    if (primeiroDigito !== '9') return false;
    if (['0', '1', '2'].includes(segundoDigito)) return false;
  }

  return true;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function setFieldError(el, msg) {
  el.classList.add('invalid');
  const errEl = document.getElementById(`err-${el.id}`);
  if (errEl) errEl.textContent = msg;
}

function clearFieldError(el) {
  el.classList.remove('invalid');
  const errEl = document.getElementById(`err-${el.id}`);
  if (errEl) errEl.textContent = '';
}

// ─── SCROLL SUAVE PARA FORMULÁRIO ─────────────────────────────
function scrollToForm(e) {
  e.preventDefault();
  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Expor globalmente (chamado via onclick no HTML)
window.scrollToForm = scrollToForm;

// ─── ANIMAÇÃO DE CONTADORES ───────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.numero-valor[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

function runCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1800; // ms
  const start    = performance.now();
  const suffix   = el.dataset.suffix ?? '';

  const tick = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutQuart(progress);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}
