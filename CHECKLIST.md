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

## 2.1 Suporte a múltiplos filhos (Pipefy + Make) — PENDENTE, fazer antes do deploy valer
O formulário agora envia até 4 alunos por card (1 card por família). É preciso configurar
manualmente no Make/Pipefy antes que os dados dos filhos 2, 3 e 4 apareçam corretamente:
- [ ] No Pipefy (Pipe "CK 2027", fase "1. Novo Contato"), criar os campos:
      `Nome do Aluno 2` / `Série de Interesse 2`, `Nome do Aluno 3` / `Série de Interesse 3`,
      `Nome do Aluno 4` / `Série de Interesse 4` (texto curto, mesmo padrão dos campos existentes)
- [ ] Criar `Quantidade de Alunos` como campo **numérico** (não texto curto — precisa somar em
      relatório)
- [ ] Criar `Resumo dos Alunos` como texto longo/parágrafo
- [ ] No Make, mapear no módulo Pipefy os novos campos do webhook: `nome_aluno_2`, `serie_2`,
      `nome_aluno_3`, `serie_3`, `nome_aluno_4`, `serie_4`, `quantidade_alunos`, `resumo_alunos`
- [ ] Salvar o cenário e **reabrir pra confirmar que o mapeamento persistiu** (já aconteceu de
      sumir antes — ver HISTORICO.md)
- [ ] Testar com um lead de teste com 2+ filhos e conferir no card do Pipefy: nomes, séries,
      `Quantidade de Alunos` e o resumo legível
- [ ] Configurar um relatório no Pipefy que **some** o campo `Quantidade de Alunos` — esse número
      é "total de matrículas", diferente da contagem de cards ("total de leads/famílias")

## 3. Identidade visual
- [ ] Substituir as cores em **style.css** → bloco `:root` (variáveis `--color-primary`, `--color-accent`, etc.)
- [ ] Adicionar logo em `assets/images/logo.webp` (WebP, máx. 200×80px)
- [ ] Ajustar o nome "Colégio Kennedy" nos textos, se necessário

## 4. Conteúdo
- [x] Atualizar headline do hero com copy aprovado ("58 Anos Formando Alunos Prontos Para o Futuro")
- [ ] Ajustar lista de séries conforme oferta real do colégio
- [ ] Revisar os 5 cards de diferenciais com informações reais
- [x] Atualizar os números (alunos, anos, aprovação, professores) — `data-target` em **index.html**
      (58 anos, 10+ espaços, turno 7h-19h já são dados reais aprovados)
- [x] Substituir os 3 depoimentos por depoimentos reais (com autorização por escrito) — Daniela/Aurora
      e Tielle/Antônio, com vídeo, já são reais e aprovados
- [ ] Preencher endereço completo, telefone, e-mail e CNPJ no footer
- [x] Definir ano das matrículas (2027) na headline
- [ ] Trocar avatares placeholder (iniciais) da prova social ("4,9 · +300 avaliações no Google")
      no form-card por fotos reais de avaliadores — **usuário vai enviar essas fotos**
- [ ] Usuário vai enviar as fotos reais dos depoimentos (Daniela/Aurora, Tielle/Antônio) para
      eventualmente ilustrar a seção de prova social com imagem, não só texto/vídeo

## 5. SEO / Meta
- [x] Ajustar `<meta name="description">` (já estava com copy real; atualizado novamente para
      incluir "58 anos" e ficar coerente com a nova headline)
- [x] Adicionar `<link rel="canonical">` com a URL definitiva: `https://www.colegiokennedy.top/`
- [x] Criar favicon e referenciar no `<head>` — usado `favicon colegio kennedy.webp` fornecido
      pelo usuário, copiado para `assets/images/favicon.webp`, com `<link rel="icon">` e
      `<link rel="apple-touch-icon">`
- [x] Adicionar Open Graph tags para compartilhamento social — `og:title`/`og:description`
      atualizados junto com a meta description
- [ ] **Confirmar**: página está com `<meta name="robots" content="noindex, nofollow">` — intencional
      para landing page só de tráfego pago, mas confirmar que não deve ser indexada organicamente

## 10. Rodada 2 de CRO/Copy (03/09/2026) — concluída
Ver detalhes completos em HISTORICO.md, seção "Rodada 2 de CRO/Copy — grupos paralelos".
- [x] Botão do CTA secundário alinhado com o texto do botão principal ("Quero garantir a vaga!")
- [x] Aviso de escassez de vagas sem número específico (política do colégio não permite número)
- [x] Selo discreto de tempo de resposta ("Tempo médio de resposta monitorado: 32 segundos"),
      sem nome de auditor terceirizado fictício
- [x] E-mail tornado opcional no formulário
- [x] Label "Em qual série vai estudar?" trocado por "Em qual turma ou etapa vai estudar?"
      (cobre melhor Berçário/Educação Infantil)
- [x] CTA secundário reforça objeção de preço ("Conheça nossas condições e bolsas disponíveis")
      e reforça prova social (4,9★ · +300 avaliações)
- [x] Vídeo de depoimento embedado na seção de prova social via lite-embed (thumbnail + play,
      sem custo de iframe no carregamento inicial)
- [x] Títulos dos 5 cards de diferenciais reescritos com foco em benefício, não recurso
- [x] Texto de privacidade do formulário vira link "Política de Privacidade" que abre modal
      in-page (não navega para fora) — texto do modal é placeholder até existir política real
- [x] CNPJ (`93.012.235/0001-84`, sem a palavra "CNPJ") e Instagram (`@colegiokennedypoa`, texto
      não clicável, não navega para fora) adicionados ao footer
- [x] CTA fixo (sticky) no rodapé da viewport, visível só em mobile
- [x] Badge "58 anos de excelência em educação" destacado visualmente entre os selos do hero

### Pendências registradas nesta rodada (não implementadas — aguardando input ou decisão futura)
- [ ] **Redução de fricção do formulário — item de checklist, depende de automação no Make**:
      simplificar o primeiro contato para nome+telefone apenas, perguntando dados do aluno
      (nome/série) depois via WhatsApp em vez de no formulário inicial. Pertinente para reduzir
      abandono, mas depende de configurar essa automação/fluxo dentro do Make antes — não é só
      mudança de front-end, precisa desenhar o fluxo pós-WhatsApp primeiro.
- [ ] **FAQ** — seção respondendo objeções comuns (documentos necessários, como funciona a bolsa,
      transporte escolar, processo após o contato via WhatsApp). Ainda não implementada.
- [ ] **Formulário multi-step / botão WhatsApp direto sem formulário** — duas ideias de redução de
      fricção a alinhar juntas com a decisão de tirar e-mail/série do formulário inicial (ver item
      acima) antes de implementar qualquer uma — evitar decidir isoladamente.
- [ ] **Texto real da Política de Privacidade** — o modal implementado nesta rodada tem só um
      texto placeholder ("em breve disponibilizaremos..."). Precisa de conteúdo jurídico real.
- [ ] **Notificações "fake" de leads recentes** (ex.: "João de Porto Alegre acabou de solicitar
      informações") para aumentar senso de urgência de preenchimento — ideia do usuário, ainda não
      desenhada nem implementada.
- [ ] **Mais fotos do colégio** — complementar a página com mais imagens reais do ambiente/espaços
      do colégio, além das duas fotos atuais (logo e alunos-kennedy.webp). Usuário vai fornecer.
- [ ] **Certificações/selos de autoridade** — pesquisar quais certificações o colégio possui (ex.
      qualidade de ensino, segurança, parcerias) para adicionar como selo de autoridade na página.
- [ ] **Elementos estratégicos adicionais de escassez/autoridade** — mapear outros pontos da
      página onde se pode reforçar subjetivamente escassez e autoridade, além do que já foi
      implementado nesta rodada (aviso de vagas + selo de resposta + badge de 58 anos).

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
