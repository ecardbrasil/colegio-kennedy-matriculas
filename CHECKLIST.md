# ✅ Checklist — Antes de Publicar

## 1. Google Tag Manager
- [x] Criar conta em tagmanager.google.com (contêiner GTM-PKM2DPSS)
- [x] Substituir `GTM-XXXXXXX` por `GTM-PKM2DPSS` em **index.html** (2 ocorrências — script e noscript)
- [x] Criar ação de conversão "Enviar formulário de lead" no Google Ads
      (ID `AW-17633043754`, rótulo `4QvMCM_n1OwcEKrKi9hB`)
- [x] Configurar tag "Google Ads - Conversão Lead Matrículas" no GTM com acionador de evento
      personalizado `lead_form_submit`
- [x] Configurar tag "Vinculador de conversões do Google Ads" (acionador All Pages)
- [x] Testar no modo Preview do GTM/Tag Assistant — tag disparou ("Concluída") no evento `lead_form_submit`
- [x] Publicar o contêiner no GTM (Versão 2 — publicada em 02/09/2026 por vinicius@colegiokennedy.com)
- [x] Fazer merge do branch de desenvolvimento (`claude/landing-page-status-vznjg8`) para o branch de
      produção (`claude/kennedy-landing-page-je9uds`) que a Vercel publica — sem isso o GTM nunca
      chegaria ao site ao vivo

## 2. Webhook do Make (Integromat)
- [x] Criar cenário no Make com módulo "Webhook"
- [x] Copiar a URL gerada
- [x] Substituir `WEBHOOK_URL` em **main.js** → `CONFIG.WEBHOOK_URL`
- [x] Conectar o Make ao Pipefy
- [x] Testar o envio com dados reais (lead de teste na Vercel → Make → Pipefy OK)
- [x] Criar campos no Pipefy (texto curto) para: GCLID, UTM Source, UTM Medium, UTM Campaign,
      UTM Term, UTM Content, Série de Interesse, URL da Página, Data/Hora do Lead
- [x] Mapear no Make (módulo Pipefy) cada campo novo com o correspondente do Webhook
      (`gclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `serie`,
      `page_url`, `timestamp`)
- [x] Testar com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas` e
      confirmar que os campos chegaram preenchidos no card do Pipefy

## 3. Identidade visual
- [ ] Substituir as cores em **style.css** → bloco `:root` (variáveis `--color-primary`, `--color-accent`, etc.)
- [ ] Adicionar logo em `assets/images/logo.webp` (WebP, máx. 200×80px)
- [ ] Ajustar o nome "Colégio Kennedy" nos textos, se necessário

## 4. Conteúdo
- [ ] Atualizar headline do hero com copy aprovado
- [ ] Ajustar lista de séries conforme oferta real do colégio
- [ ] Revisar os 5 cards de diferenciais com informações reais
- [ ] Atualizar os números (alunos, anos, aprovação, professores) — `data-target` em **index.html**
- [ ] Substituir os 3 depoimentos por depoimentos reais (com autorização por escrito)
- [ ] Preencher endereço completo, telefone, e-mail e CNPJ no footer
- [ ] Definir ano das matrículas (ex.: 2026) na headline

## 5. SEO / Meta
- [x] Ajustar `<meta name="description">` (já estava com copy real)
- [x] Adicionar `<link rel="canonical">` com a URL definitiva: `https://www.colegiokennedy.top/`
- [ ] Criar favicon (`assets/images/favicon.ico` ou `.svg`) e referenciar no `<head>`
- [ ] Adicionar Open Graph tags para compartilhamento social (opcional)
- [ ] **Confirmar**: página está com `<meta name="robots" content="noindex, nofollow">` — intencional
      para landing page só de tráfego pago, mas confirmar que não deve ser indexada organicamente

## 6. Deploy no Vercel
```bash
# 1. Instale o CLI (uma vez só)
npm i -g vercel

# 2. Na pasta do projeto
vercel

# 3. Siga as perguntas:
#    - Set up and deploy? → Y
#    - Which scope? → sua conta
#    - Link to existing project? → N (primeira vez)
#    - Project name → colegio-kennedy-matriculas
#    - In which directory is your code? → ./
#    - Override settings? → N

# 4. Deploy de produção
vercel --prod
```

## 7. Domínio personalizado (Vercel)
- [x] Em vercel.com → projeto → Settings → Domains → adicionado `colegiokennedy.top` e `www.colegiokennedy.top`
- [x] Atualizado DNS na Hostgator (registro A do domínio raiz apontando pro IP da Vercel;
      `www` já era CNAME pro domínio raiz, seguiu automaticamente)
- [x] Confirmado "Valid Configuration" nos 3 domínios (raiz, www e o .vercel.app de fallback)
- [x] `colegiokennedy.top` redireciona (308) para `www.colegiokennedy.top` (produção)

## 8. Google Ads
- [x] Confirmado "Codificação automática: Sim" em Configurações da conta (equivalente a
      auto-tagging — anexa o `gclid` automaticamente em toda URL de destino dos anúncios)
- [ ] **FUTURO:** importar conversões offline usando o GCLID capturado no webhook, quando já
      houver leads reais convertidos em matrícula no Pipefy

## 9. Teste final
- [ ] Abrir a página com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas`
- [ ] Verificar campos hidden preenchidos (DevTools → Elements)
- [ ] Submeter o formulário e confirmar recebimento no Make
- [ ] Confirmar evento `lead_form_submit` no dataLayer (DevTools → Console: `dataLayer`)
- [ ] Testar em mobile (360px) e desktop
- [ ] Rodar no PageSpeed Insights → meta: LCP < 2.5s, Performance > 90
