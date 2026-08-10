# ✅ Checklist — Antes de Publicar

## 1. Google Tag Manager
- [ ] Criar conta em tagmanager.google.com
- [ ] Substituir `GTM-XXXXXXX` por seu ID real em **index.html** (2 ocorrências — script e noscript)
- [ ] Configurar tag de conversão do Google Ads dentro do GTM
- [ ] Ativar o trigger no evento `lead_form_submit`

## 2. Webhook do Make (Integromat)
- [ ] Criar cenário no Make com módulo "Webhook"
- [ ] Copiar a URL gerada
- [ ] Substituir `WEBHOOK_URL` em **main.js** → `CONFIG.WEBHOOK_URL`
- [ ] Conectar o Make ao CRM/planilha/e-mail desejado
- [ ] Testar o envio com dados reais

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
- [ ] Ajustar `<meta name="description">` com copy real
- [ ] Adicionar `<link rel="canonical">` com a URL definitiva do domínio
- [ ] Criar favicon (`assets/images/favicon.ico` ou `.svg`) e referenciar no `<head>`
- [ ] Adicionar Open Graph tags para compartilhamento social (opcional)

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
- [ ] Em vercel.com → projeto → Settings → Domains
- [ ] Adicionar `matriculas.colegiokennedy.com.br` (ou domínio escolhido)
- [ ] Atualizar DNS no registrador (CNAME → `cname.vercel-dns.com`)

## 8. Google Ads
- [ ] Configurar parâmetro de URL final: `{lpurl}?gclid={gclid}`
- [ ] Ou usar auto-tagging do Google Ads (mais simples — ativa em Configurações da conta)
- [ ] Importar conversões offline usando o GCLID capturado no webhook

## 9. Teste final
- [ ] Abrir a página com `?gclid=TESTE123&utm_source=google&utm_medium=cpc&utm_campaign=matriculas`
- [ ] Verificar campos hidden preenchidos (DevTools → Elements)
- [ ] Submeter o formulário e confirmar recebimento no Make
- [ ] Confirmar evento `lead_form_submit` no dataLayer (DevTools → Console: `dataLayer`)
- [ ] Testar em mobile (360px) e desktop
- [ ] Rodar no PageSpeed Insights → meta: LCP < 2.5s, Performance > 90
