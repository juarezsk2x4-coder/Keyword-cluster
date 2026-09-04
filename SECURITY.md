# Segurança dos API Keys

Como manter `ANTHROPIC_API_KEY`, `TURSO_AUTH_TOKEN` e qualquer credencial fora do GitHub. Resumão prático.

## Como o sistema é projetado pra não vazar a chave

1. **A chave NUNCA está no código.** O arquivo `app/src/lib/nutrition-ai.ts` lê `process.env.ANTHROPIC_API_KEY` em runtime no servidor. A string da chave nunca é hard-coded.
2. **Server-side only.** Toda chamada pra Anthropic API acontece via **Server Action** do Next.js. O navegador (e qualquer cliente — celular, browser DevTools, etc.) **não vê a chave**. O bundle JavaScript que vai pro usuário não contém a chave.
3. **Vercel armazena a chave em ambiente isolado.** Ela existe só dentro do container de execução do servidor. Não aparece nos logs públicos, nem no front-end, nem no GitHub.
4. **`.gitignore` reforçado** bloqueia qualquer `.env*` (exceto `.env.example` que tem só placeholders), além de `*.pem`, `*.key`, `credentials.json`, `service-account*.json`, etc.

### Exceção importante: `CALENDAR_FEED_TOKEN`

Os pontos 1–3 acima valem pra `ANTHROPIC_API_KEY` e `TURSO_AUTH_TOKEN`, que
nunca saem do servidor. **`CALENDAR_FEED_TOKEN` é diferente**: a página
`/profile` imprime a URL completa de assinatura, token incluído, no HTML — é o
propósito dela, você precisa copiar essa URL pro Google/Apple Calendar.

Consequências:

- Quem conseguir abrir `/profile` lê o token. Hoje isso está contido porque o
  **Vercel Deployment Protection (Vercel Authentication)** está ativado no
  projeto, então a URL `*.vercel.app` exige login na conta Vercel. Essa
  proteção **não** cobre domínio próprio automaticamente.
- A mesma página também mostra flags médicas, peso, % de gordura e BMR. O
  token é o vazamento menor dos dois.
- Se o token vazar, o dano é limitado: o feed iCal expõe só horários de
  refeição, os rótulos genéricos dos slots e quais dias são de skate. Não
  contém nomes de pratos, substâncias, medicações nem dados clínicos.
- Pra revogar: troca o valor de `CALENDAR_FEED_TOKEN` no Vercel e reassina o
  calendário com a URL nova. A rota nega tudo (401) enquanto a var estiver
  vazia, então ela nunca fica aberta por acidente.

## Auditoria atual do repo

✅ **Zero chaves reais nos arquivos commitados** — confirmado por grep regex contra padrões da Anthropic (`sk-ant-...`), Turso (`eyJ...`), AWS, Google, Stripe. Só placeholders no `.env.example`.

## Boas práticas que você deve seguir

### Nunca faça
- ❌ Colar a chave em um commit message
- ❌ Colar a chave em um issue ou PR no GitHub
- ❌ Colar a chave numa mensagem aqui no chat com o assistente
- ❌ Criar um `.env.local` com a chave real e fazer `git add .` sem checar o que está sendo staged
- ❌ Compartilhar screenshots do Vercel Environment Variables page (a chave fica visível ali)
- ❌ Logar `console.log(process.env.ANTHROPIC_API_KEY)` em qualquer lugar do código

### Sempre faça
- ✅ Adicionar a chave **apenas na UI do Vercel** (Settings → Environment Variables)
- ✅ Antes de comitar mudanças, rode `git status` e olhe o que está sendo enviado
- ✅ Se desconfiar que vazou, **rotacione a chave imediatamente** (próxima seção)

## Como rotacionar a chave se suspeitar de vazamento

### Anthropic API Key
1. Vai em https://console.anthropic.com
2. **Settings → API Keys**
3. Acha a chave atual → toca **"Revoke"**
4. **"Create Key"** → cria nova → copia
5. No Vercel: **Settings → Environment Variables** → edita `ANTHROPIC_API_KEY` → cola a nova → Save
6. **Deployments → último deploy → 3 pontinhos → Redeploy**
7. A chave antiga para de funcionar em segundos. A nova entra em vigor após o redeploy.

### Turso Auth Token
1. https://turso.tech → seu banco → **Tokens** tab
2. Revoke o token comprometido
3. Generate novo
4. Vercel → atualiza `TURSO_AUTH_TOKEN` → Redeploy

### Calendar Feed Token
Menor risco que os dois acima — não é uma chave de terceiros, é uma string que você mesmo escolhe (`openssl rand -hex 32`), e só protege a assinatura de calendário (horários de refeição + dias de skate, sem dado clínico). Ainda assim, se a URL da página `/profile` for compartilhada sem querer:
1. Gera um novo valor (`openssl rand -hex 32`)
2. Vercel → atualiza `CALENDAR_FEED_TOKEN` → Redeploy
3. A URL antiga (com o token velho) para de funcionar; a nova URL aparece automaticamente na página `/profile`.

## Push Protection no GitHub (gratuito em repos públicos)

Se o teu repo for **público**, ative o GitHub Push Protection — ele bloqueia commits que contêm chaves de provedores conhecidos (Anthropic incluso) **antes** de ir pra branch:

1. Vai no repo no GitHub
2. **Settings → Code security**
3. Em **"Secret scanning"**, ativa **"Push protection"**
4. Pronto. Tentativa de push com `sk-ant-...` real é bloqueada na hora.

Pra repos **privados**, push protection requer GitHub Advanced Security (pago). Nesse caso, a defesa fica no `.gitignore` + hábito + rotacionar se duvidar.

## Verificar histórico antigo

Se você (ou outra pessoa) já commitou uma chave no passado e não percebeu, ela continua acessível em todo o histórico do git mesmo depois de removida. Pra varrer:

```bash
# Roda na raiz do repo
git log --all --full-history -p | grep -E "sk-ant-[a-zA-Z0-9_-]{30,}" | head
git log --all --full-history -p | grep -E "eyJ[A-Za-z0-9_-]{200,}" | head
```

Se aparecer algo: **rotaciona a chave imediatamente** (a remoção do histórico via `git filter-repo` é trabalhosa e não impede que quem já clonou tenha visto). A solução definitiva é sempre: trocar a chave.

## TL;DR

- A chave do Anthropic só existe no Vercel. Nunca no repo.
- `.gitignore` bloqueia `.env*` (exceto example) + arquivos comuns de credencial.
- Se vazar, rotaciona em 2 minutos pelo Console Anthropic.
- Em repo público, ativa Push Protection nas configs do GitHub.
