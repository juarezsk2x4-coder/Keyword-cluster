# Deploy do celular — passo a passo

Guia pra subir o app na internet **só usando o navegador do celular**. Sem terminal, sem instalar nada. Você termina com uma URL tipo `https://plano-a.vercel.app` que abre como app normal.

Vai usar 2 serviços, ambos free, ambos via login do GitHub:

| Serviço | Pra quê | Free tier |
|---|---|---|
| **Turso** (turso.tech) | Banco de dados (guarda tudo que você loga) | 9 GB grátis, 1 bilhão de reads/mês |
| **Vercel** (vercel.com) | Hospedar o app | 100 GB de tráfego/mês grátis |

Tempo total: **~15 minutos**.

---

## Passo 1: Criar conta no Turso (3 min)

1. Abre **https://turso.tech** no navegador do celular.
2. Toca em **"Sign up"** (canto superior direito).
3. Escolhe **"Continue with GitHub"** — usa a mesma conta GitHub que você usa pro repo.
4. Autoriza o Turso a ler seu GitHub.
5. Na primeira tela, escolhe um nome pra organização (pode ser teu nome mesmo, tipo `joao-linhares`).
6. **Importante**: na escolha de plano, seleciona **"Hobby"** (free, $0/mês).

## Passo 2: Criar o banco (2 min)

1. Já dentro do Turso, toca em **"Create Database"** (botão grande).
2. Nome do banco: `plano-a` (ou qualquer coisa).
3. **Region**: escolhe **`São Paulo (gru)`** ou **`Rio de Janeiro (gig)`** se aparecer — fica perto, baixa latência. Se não aparecer, qualquer uma da América do Sul ou EUA Leste.
4. Toca **"Create Database"**.
5. Aguarda ~10 segundos.

## Passo 3: Pegar as credenciais (2 min)

Depois que criar, vai aparecer a tela do banco. **Anote estes 2 valores** (copia pro app de Notas do celular, vai usar daqui a pouco):

1. Toca na aba **"Overview"** (ou no nome do banco).
2. Procura **"Database URL"** — algo tipo `libsql://plano-a-joao.turso.io`. **Copia.**
3. Toca em **"Connect"** ou **"Show credentials"** (varia a UI).
4. Procura **"Generate Token"** ou **"Auth Token"**. Toca pra gerar. Vai aparecer um token longo (começa com `eyJ...`). **Copia inteiro.**

Salva os dois no app de Notas com etiqueta:
```
TURSO_DATABASE_URL = libsql://plano-a-joao.turso.io
TURSO_AUTH_TOKEN   = eyJ...token-gigante-aqui...
```

## Passo 4: Criar conta no Vercel (2 min)

1. Abre **https://vercel.com** no celular.
2. Toca **"Sign Up"** → **"Continue with GitHub"** → mesma conta.
3. Autoriza Vercel a ler teus repos.
4. Na pergunta de plano: escolhe **"Hobby"** (free).

## Passo 5: Importar o repo (3 min)

1. Já logado no Vercel, toca **"Add New..."** → **"Project"**.
2. Aparece lista dos teus repos do GitHub. Procura **`Keyword-cluster`** e toca **"Import"**.
3. Na tela de configuração:
   - **Project Name**: `plano-a` (ou o que quiser)
   - **Framework Preset**: Next.js (já vem auto-detectado se mostrou)
   - **Root Directory**: ⚠️ **IMPORTANTE** — toca em "Edit" ao lado de "Root Directory" e digita `app`. (Sem isso ele não acha o código.)
   - **Build Command, Install Command, Output Directory**: deixa o padrão. Vercel cuida.

## Passo 6: Configurar as variáveis de ambiente (2 min)

Ainda na tela de import, **antes** de clicar Deploy:

1. Procura **"Environment Variables"** (geralmente expandível, toca pra abrir).
2. Adiciona a primeira:
   - **Name**: `TURSO_DATABASE_URL`
   - **Value**: cola o URL do Turso que você salvou (`libsql://...`)
3. Adiciona a segunda:
   - **Name**: `TURSO_AUTH_TOKEN`
   - **Value**: cola o token enorme do Turso (`eyJ...`)
4. **Branch importante**: Vercel by default usa a `main`. Mas o código tá na branch `claude/meal-planning-agents-0gn0Q`. Vai precisar mudar isso. Veja Passo 8.

## Passo 7: Deploy! (1 min)

Toca em **"Deploy"** (botão grande, embaixo).

Aguarda 1-3 minutos enquanto o Vercel:
- Clona o repo
- Roda `pnpm install` na pasta `app/`
- Roda `pnpm build`
- Sobe pro CDN dele

Vai aparecer uma tela com confete quando der certo. **Copia a URL** (algo tipo `https://plano-a-xxx.vercel.app`).

## Passo 8: Configurar pra branch correta (3 min)

⚠️ Por padrão Vercel deploy da `main`. Como o código tá na `claude/meal-planning-agents-0gn0Q`, precisa apontar pra ela.

**Opção A — Mais simples**: faz merge do branch pra `main` no GitHub
1. No navegador, abre o repo no GitHub.
2. Vai em **Pull Requests** → **New Pull Request**.
3. Base: `main`, Compare: `claude/meal-planning-agents-0gn0Q`.
4. Cria o PR, depois Merge.
5. Vercel detecta o push em `main` e faz deploy automático.

**Opção B — Mantém branch separada**:
1. No Vercel, abre o projeto recém-criado.
2. Vai em **Settings** → **Git** → **Production Branch**.
3. Muda de `main` pra `claude/meal-planning-agents-0gn0Q`.
4. Volta em **Deployments** e dispara um novo deploy.

Recomendo a **Opção A** (merge pra main) porque deixa mais limpo a longo prazo.

---

## Passo 9: Testar (1 min)

Abre a URL do Vercel no celular. Deve carregar:
- Hoje (dashboard com cards de refeição)
- Compras (lista dividida em delivery + self-carry)
- Perfil (lê do YAML)
- Histórico (vazio até você logar algo)

**Toca em qualquer chip de sono ou tempo de prep** — se persistir após refresh, o Turso tá conectado certo. Se der erro, voltar pro Passo 6 e conferir as env vars.

## Passo 10: Adicionar à tela inicial (30s)

No iPhone (Safari):
1. Abre a URL do Vercel.
2. Toca o botão de compartilhar (quadrado com seta pra cima).
3. **"Adicionar à Tela Inicial"**.
4. Nome: "Plano A" → Adicionar.

No Android (Chrome):
1. Abre a URL.
2. Toca os 3 pontinhos (canto superior direito).
3. **"Adicionar à tela inicial"** ou **"Instalar app"**.
4. Confirma.

Pronto. Vira um app na tela inicial do celular. Toca e abre fullscreen, sem barra do navegador.

---

## Atualizações futuras

Toda vez que eu (ou você) der `git push` na branch que o Vercel observa, o deploy é automático em ~2 minutos. Não precisa fazer nada — só esperar.

## Custo

Hoje: **R$ 0,00**. Turso Hobby + Vercel Hobby cobrem tranquilamente um app pessoal com logging diário. Você passa do free tier somente se virar viral.

## Se algo der errado

1. **"Build Failed" no Vercel**: abre os logs do deploy (clica no deploy que falhou). Manda print pro chat aqui.
2. **App abre mas dá erro de DB**: env vars provavelmente erradas. Vai em **Settings → Environment Variables** no projeto Vercel e confere. Depois **Deployments → Redeploy**.
3. **Toca o chip de sono e não persiste**: mesma coisa — env var ou token expirado. Volta no Turso, gera token novo, atualiza no Vercel.
4. **Tela em branco**: tipicamente o Root Directory está errado. Vai em **Settings → General → Root Directory** e confere se está `app`.

Manda print de qualquer erro que aparecer.
