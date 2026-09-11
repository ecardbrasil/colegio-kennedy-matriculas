# 📊 Infraestrutura de Tracking, Meta Ads (Fundamental 1 e 2, 2027)

> Documento de referência para a campanha de Meta Ads (setembro a dezembro de 2026).
> Cobre `colegiokennedy.top` (satélite de anúncios, este repositório) e `colegiokennedy.com`
> (site institucional, fora deste repositório).

## 0. Resumo executivo

| Item | Status |
|---|---|
| Meta Pixel em `colegiokennedy.top` | ✅ Código pronto neste repo, **falta só o ID do Pixel real** |
| Meta Pixel em `colegiokennedy.com` | ⏸️ Adiado por decisão do Vini (11/09/2026) — foco agora é só o `.top`. Retomar depois. |
| Conversions API (CAPI) | ⚠️ Payload já pronto no front-end (fbclid/fbp/fbc/event_id). Falta criar o módulo no Make e ligar ao Pixel certo |
| UTM padronizado | ✅ Definido abaixo, já suportado pelo formulário |
| PII na URL | ✅ Confirmado: nenhum dado pessoal trafega por querystring |
| Pixel para usar na campanha | ✅ **Decidido**: criar um Pixel novo, dedicado ao Business "Colégio Kennedy", reutilizável em todas as campanhas futuras. **Falta a criação em si**, que precisa ser feita por você na interface do Business Manager (ver seção 1.2) — não existe API disponível aqui para criar um Pixel do zero. |

---

## 1. Diagnóstico do estado atual

### 1.1 Meta Pixel na sua Business Manager

Levantei todos os pixels/datasets existentes na sua conta (Business "Colégio Kennedy Portfolio
CONTA FB VINI", ID `1805801449481336`):

| Nome | ID | Criado em | Último disparo | Situação |
|---|---|---|---|---|
| Pixel CK 2021/2 - CAMPANHA MATRICULA | `189647716385773` | jul/2021 | **hoje (10/09/2026)** | ⚠️ Ativo, mas mal configurado (ver abaixo) |
| WHATSAPP COLEGIO KENNEDY 2025 Event Data | `560606423681072` | fev/2025 | nunca disparou | Criado, sem eventos configurados, órfão |
| Pixel de Colégio Kennedy | `387548668933245` | out/2020 | mai/2021 | Abandonado |
| Pixel de CONTA 02 / Super Dezembro / Estudar.la / Pixel Pense Leve | vários | 2020/2021 | 2020/2021 | Abandonados, de campanhas antigas não relacionadas |

**Achado importante**: o pixel `189647716385773` disparou **hoje**, o que confirma que ele ainda
está instalado em algum lugar do `colegiokennedy.com` (provavelmente sitewide, desde 2021). Os
eventos configurados nele:
- `Purchase`, disparado por clique no texto "ir para whats app" — **errado**: um clique não é uma
  compra, isso infla o Gerenciador de Eventos com conversões falsas de alto valor.
- `ViewContent`, amarrado à URL antiga `colegiokennedy.com/matriculas-2021/` — página que
  provavelmente nem existe mais.

**Recomendação**: não reaproveitar este pixel para a campanha 2027. Ele carrega sinal ruim (anos
de eventos mal rotulados) e está goteirado a uma página/campanha morta.

### 1.2 Pixel x Conta de anúncios que vai rodar a campanha

Sua conta de anúncios ativa para isso, **"conta de anúncios 1"** (ID `336217086165592`), pertence
ao Business **"Colégio Kennedy"** (ID `418840574358953`) — um Business **diferente** do que tem os
pixels acima. Resultado: **essa conta de anúncios hoje não tem nenhum Pixel associado.**

**✅ Decidido (11/09/2026)**: criar um Pixel novo, limpo, direto no Business "Colégio Kennedy",
para ser reutilizado em todas as campanhas futuras (não só esta). Nome sugerido:
**`Pixel CK, Institucional`** (ou algo assim, que não amarre o nome a uma campanha específica, já
que vai durar além da 2027).

**⚠️ Limitação importante**: as ferramentas de Meta Ads que tenho disponíveis nesta sessão
conseguem **gerenciar** um Pixel já existente (configurar eventos, ler estatísticas, criar
públicos a partir dele etc.), mas **não conseguem criar um Pixel/dataset novo do zero** — essa
ação só existe pela interface do Business Manager, não pela API disponível aqui. Então esse passo
específico precisa ser feito por você (ou por quem tiver acesso de admin no Business Manager):

1. Acesse [business.facebook.com/events_manager](https://business.facebook.com/events_manager2) →
   selecione o Business **"Colégio Kennedy"** (não o "Portfolio CONTA FB VINI").
2. **Conectar fontes de dados** → **Web** → **Meta Pixel** → dar o nome (`Pixel CK, Institucional`)
   → **Criar Pixel**.
3. Me envie o **ID numérico** gerado (aparece logo depois de criado, formato `123456789012345`).
4. Se possível, já associe esse Pixel à conta de anúncios **"conta de anúncios 1"**
   (`336217086165592`) em Configurações do Pixel → Contas de anúncios conectadas.

Assim que tiver o ID, eu: (a) troco nos 2 lugares de `index.html` (seção 1.3), (b) configuro os
eventos padrão no Pixel via API (`ads_pixel_event_create`), e (c) configuro o módulo de CAPI no
Make (seção 2.2) — essas três partes eu resolvo sozinho, só a criação inicial do Pixel depende de
você.

### 1.3 `colegiokennedy.top` (este repositório)

Antes desta tarefa: só tinha Google Tag Manager (GTM-PKM2DPSS) com a conversão do Google Ads.
Nenhum Meta Pixel, nenhuma captura de `fbclid`.

**O que já implementei neste repo:**
- Snippet base do Meta Pixel no `<head>` de `index.html` (com fallback `<noscript>`), disparando
  `PageView` em toda página.
- Campo oculto `fbclid` no formulário, capturado do jeito que `gclid`/UTMs já eram (`main.js`,
  `captureUrlParams()`).
- Leitura dos cookies `_fbp`/`_fbc` (criados pelo próprio Pixel) e montagem manual do `fbc` quando
  o visitante chega com `?fbclid=` mas o cookie ainda não existe (primeira visita).
- Evento `event_id` único por envio (UUID), usado para deduplicar o mesmo evento entre o Pixel
  (navegador) e a CAPI (servidor).
- Evento customizado **`lead_form_submitted`** disparado no Pixel a cada envio bem-sucedido do
  formulário, com as propriedades `source` (= utm_source), `campaign` (= utm_campaign) e `segment`
  (= série/etapa de interesse escolhida).
- Todos esses dados (`fbclid`, `fbp`, `fbc`, `event_id`) agora vão também no payload que o
  `main.js` envia pro webhook do Make, para a CAPI poder usar (seção 3).

**O que falta, e depende de você:**
- Trocar `000000000000000` pelo ID real do Pixel em **dois lugares** de `index.html`: no `fbq('init', ...)` e na URL `facebook.com/tr?id=...` do `<noscript>`. Busque por `⚠️` no arquivo.

### 1.4 `colegiokennedy.com` (site institucional), ⏸️ adiado por decisão do Vini

**Status (11/09/2026)**: por decisão sua, ficamos focados só no `colegiokennedy.top` por enquanto.
O ajuste do `colegiokennedy.com` fica registrado aqui como pendência para quando você quiser
retomar, sem bloquear nada do que está em andamento.

Contexto para quando voltar a isso: este site **não está neste repositório** — não tenho acesso ao
código-fonte/CMS dele nesta sessão. Vai ser preciso me dar acesso (repositório Git, credenciais de
FTP/hosting, ou acesso ao CMS). Pelo achado da seção 1.1, há uma pendência real: o pixel antigo
`189647716385773` está ativo lá com eventos errados (`Purchase` disparado por clique de WhatsApp),
e deveria ou ser desativado/substituído pelo pixel novo criado na seção 1.2 (o mesmo, já que a
ideia é ele ser reutilizável em todas as campanhas), ou pelo menos ter os event rules corrigidos.

Como esse não é o site que vai receber o tráfego pago desta campanha (é o `colegiokennedy.top`),
isso **não bloqueia o lançamento da campanha atual**, mas polui os dados do Gerenciador de Eventos
e pode atrapalhar otimização de Advantage+/lookalikes no futuro se usar esse Business inteiro como
fonte.

---

## 2. Passo a passo do que falta implementar

### 2.1 Meta Pixel (você, ~5 min)
1. Decidir Pixel (seção 1.2) e me passar o ID, **ou** me dar acesso ao Business Manager para eu
   confirmar/criar.
2. Eu troco `000000000000000` pelo ID real em `index.html` (2 ocorrências) e faço o deploy.

### 2.2 Conversions API, via Make (eu faço, preciso de 1 credencial sua)
O payload que o `main.js` envia ao webhook do Make **já inclui** `fbclid`, `fbp`, `fbc` e
`event_id`. Falta só adicionar um módulo no cenário do Make **"Formulário ck.top → pipefy"**
(replicando exatamente a lógica que vocês já usam para o `gclid` no Google Ads, mas mandando pra
Meta em vez de só guardar no Pipefy):

1. No módulo `CustomWebHook` (já existe), os campos `fbclid`, `fbp`, `fbc`, `event_id` já chegam
   automaticamente assim que o deploy do Pixel (2.1) estiver no ar.
2. Adicionar um módulo **HTTP → Make a request** (ou o módulo nativo "Facebook Conversions API",
   se disponível na sua conta Make) logo após o Webhook, em paralelo ao `createCardV2` do Pipefy,
   fazendo `POST` para:
   ```
   https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token={CAPI_ACCESS_TOKEN}
   ```
   com corpo:
   ```json
   {
     "data": [{
       "event_name": "lead_form_submitted",
       "event_time": {{ timestamp Unix }},
       "event_id": "{{2.event_id}}",
       "action_source": "website",
       "event_source_url": "{{2.page_url}}",
       "user_data": {
         "ph": ["{{ telefone normalizado e com hash SHA-256 }}"],
         "em": ["{{ email normalizado e com hash SHA-256, se houver }}"],
         "fbc": "{{2.fbc}}",
         "fbp": "{{2.fbp}}"
       },
       "custom_data": {
         "source": "{{2.utm_source}}",
         "campaign": "{{2.utm_campaign}}",
         "segment": "{{2.serie_1}}"
       }
     }]
   }
   ```
   **Importante sobre `ph`/`em`**: a Meta exige que telefone e e-mail sejam normalizados
   (minúsculo, sem espaços, telefone com código do país sem símbolos) e depois transformados em
   hash SHA-256 antes do envio — nunca em texto puro. Isso pode ser feito com uma função de
   texto/hash dentro do próprio Make (módulo "Text: Hash" ou similar), não precisa expor nenhuma
   ferramenta externa.
3. O `event_id` **precisa ser idêntico** ao que o Pixel do navegador já usou (`payload.event_id`,
   já mapeado como `{{2.event_id}}` no Make) — é isso que faz a Meta reconhecer que é o mesmo
   evento chegando por dois caminhos e não contar como duas conversões.
4. **Preciso de você**: o **Access Token do sistema (CAPI)**, gerado em Events Manager → [Pixel
   escolhido] → Configurações → Conversions API → "Gerar token de acesso". Me envie quando tiver
   decidido o Pixel da seção 1.2 — eu configuro o módulo no Make com ele (fica salvo como
   credencial no próprio Make, não no código deste repositório).

### 2.3 UTM padronizado (já implementado, só documentando)
Ver seção 3 abaixo. O `main.js` já captura e envia qualquer combinação desses parâmetros, não
precisa de nenhuma mudança de código para usar o padrão.

---

## 3. Estrutura de UTM padronizada, Meta Ads (Fundamental 1 e 2, 2027)

Use sempre estes 4 parâmetros na URL de destino de **todo** anúncio do Meta (Facebook/Instagram)
desta campanha:

| Parâmetro | Valor | Exemplo |
|---|---|---|
| `utm_source` | `facebook` ou `instagram` (conforme a plataforma/posicionamento do anúncio) | `facebook` |
| `utm_medium` | sempre `paid_social` | `paid_social` |
| `utm_campaign` | nome da campanha, minúsculo, sem espaço (`_` no lugar) | `f1f2_2027` |
| `utm_content` | identificador do criativo específico | `founder_video`, `grid_static` |

**Exemplo de URL de destino completa:**
```
https://www.colegiokennedy.top/?utm_source=instagram&utm_medium=paid_social&utm_campaign=f1f2_2027&utm_content=founder_video
```

**Onde configurar**: no Gerenciador de Anúncios do Meta, em cada anúncio (não no conjunto nem na
campanha), em "URL do site" → parâmetros de URL, ou usando as variáveis dinâmicas do Meta
(`{{campaign.name}}`, `{{ad.name}}`) se preferir automatizar em vez de digitar `f1f2_2027`/
`founder_video` manualmente — nesse caso o Make simplesmente recebe o valor já resolvido, sem
mudança nenhuma de código.

**Sem PII na URL**: confirmado. O formulário só lê da URL os parâmetros técnicos (`gclid`,
`fbclid`, `utm_*`) via `captureUrlParams()`. Nome, telefone e e-mail da família são digitados
diretamente no formulário e enviados só no corpo (`body`) da requisição POST para o Make, nunca
como parte de uma URL, nunca em texto visível em query string, redirecionamento ou link
compartilhável.

---

## 4. Validação técnica, checklist para você rodar antes de qualquer verba entrar no ar

- [ ] **Pixel base**: abrir `colegiokennedy.top` com a extensão "Meta Pixel Helper" do Chrome
      instalada, confirmar que aparece o Pixel certo (ID definido na seção 1.2) disparando
      `PageView` sem erros.
- [ ] **Gerenciador de Eventos, teste de eventos**: em Events Manager → [Pixel] → Testar eventos,
      abrir a URL de teste (`https://www.colegiokennedy.top/?utm_source=facebook&utm_medium=paid_social&utm_campaign=f1f2_2027&utm_content=teste`),
      preencher e enviar o formulário completo, confirmar que aparece:
      - Evento `lead_form_submitted` vindo do **navegador** (ícone de computador)
      - Evento `lead_form_submitted` vindo do **servidor** (ícone de servidor, CAPI), com o mesmo
        `event_id`
      - Um selo de **"Deduplicado"** unindo os dois, não duas linhas separadas
- [ ] **Propriedades do evento**: no evento capturado, conferir que `source`, `campaign` e
      `segment` chegaram preenchidos e corretos (não vazios, não "undefined").
- [ ] **Qualidade de correspondência (Match Quality)**: no Pixel, aba "Diagnóstico" ou "Qualidade
      de eventos", conferir se o CAPI está contribuindo com parâmetros de `user_data` (telefone/
      e-mail com hash) e não só `fbp`/`fbc` — isso aumenta a taxa de correspondência de pessoas.
- [ ] **Sem duplicidade**: no card de eventos do Pixel, confirmar que o volume de
      `lead_form_submitted` bate com o número real de envios de formulário (não o dobro), ou seja,
      a deduplicação por `event_id` está funcionando.
- [ ] **UTM até o Pipefy**: submeter um lead de teste com
      `?utm_source=facebook&utm_medium=paid_social&utm_campaign=f1f2_2027&utm_content=teste` e
      conferir no card criado no Pipefy (Pipe "CK 2027") que os campos UTM Source/Medium/Campaign/
      Content chegaram com esses valores exatos.
- [ ] **fbclid/fbp/fbc até o Make**: no histórico de execuções do cenário "Formulário ck.top →
      pipefy" (aba History), abrir a execução do lead de teste e conferir que o payload recebido
      pelo Webhook trouxe `fbclid`, `fbp`, `fbc` e `event_id` preenchidos.
- [ ] Testar em mobile e desktop (o Pixel/CAPI não dependem de layout, mas o `_fbp`/cookies podem
      se comportar diferente em navegadores in-app do Instagram/Facebook, vale um teste real
      clicando num anúncio de teste a partir do próprio app).

---

## 5. Checklist de compliance/LGPD

- [x] **Sem PII em URL**: confirmado na seção 3, nenhum dado pessoal (nome, telefone, e-mail)
      trafega por parâmetro de URL, em nenhum dos dois sites.
- [x] **Sem PII em propriedades de evento do Pixel**: o evento `lead_form_submitted` só carrega
      `source`, `campaign` e `segment` (dados de contexto de marketing, não pessoais). Nome,
      telefone e e-mail **não** são passados como propriedade de evento do Pixel — só seguem,
      já no servidor, via CAPI, e ali obrigatoriamente com hash SHA-256 (seção 2.2), nunca em
      texto puro.
- [x] **Política de Privacidade atualizada**: `politica-privacidade.html` (seção "7. Cookies e
      ferramentas de rastreamento") agora menciona explicitamente o Meta Pixel, o `fbclid` e o
      uso da Conversions API, com a mesma linguagem que já existia para Google Ads/GTM/gclid.
- [ ] **Base legal para públicos customizados/lookalike** (uso futuro, não usado nesta tarefa):
      caso decidam no futuro subir a lista de contatos de famílias (telefone/e-mail) para criar
      Público Personalizado ou Lookalike no Meta Ads, a base legal recomendada é:
      - **Legítimo interesse** do colégio em anunciar produtos/serviços educacionais para quem já
        é família cadastrada (mesma linha do que já é feito hoje com remarketing por telefone no
        Google Ads via Zapier, conforme HISTORICO.md), **ou**
      - **Consentimento explícito**, se preferirem o caminho mais conservador (ex.: uma checkbox
        adicional no formulário, algo como "Aceito receber comunicações de marketing do Colégio
        Kennedy").
      Adicionei um parágrafo na Política de Privacidade cobrindo esse uso futuro (hash antes do
      envio, sem compartilhamento de dado legível), mas a **decisão de qual base legal usar, e se
      vão de fato subir essa lista, é sua** — isso é decisão de negócio/jurídica, não técnica. Como
      você está se formando em Direito, pode valer uma checagem sua ou de quem cuida do
      compliance do colégio antes de ativar isso na prática (não bloqueia a campanha atual, que
      não usa públicos customizados).

---

## 6. Resumo do que preciso de você para fechar 100% (foco atual: `colegiokennedy.top`)

1. ~~Decisão de Pixel~~ ✅ Decidido em 11/09/2026: Pixel novo, dedicado ao Business "Colégio
   Kennedy", reutilizável em todas as campanhas futuras (seção 1.2).
2. **Criar esse Pixel no Business Manager** (passo a passo na seção 1.2) e me passar o **ID
   numérico** gerado — essa criação específica só pode ser feita por você, minhas ferramentas não
   criam um Pixel do zero, só gerenciam um que já existe.
3. **Access Token da Conversions API** desse Pixel (depois de criado: Events Manager →
   Configurações → Conversions API → Gerar token), para eu configurar o módulo no Make.
4. ~~Acesso ao `colegiokennedy.com`~~ ⏸️ Adiado por decisão sua (11/09/2026) — foco agora é só o
   `.top`. Fica registrado na seção 1.4 para quando quiser retomar.
