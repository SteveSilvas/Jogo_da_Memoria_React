# AGENTS.md

## Estrutura do repositório

Este repositório é um monorepo com duas versões do jogo da memória:

- `Jogo_da_Memoria_React/` — app web (React + TypeScript + Vite). **É o app publicado.**
- `JogoDaMemoria_ReactNative/` — versão mobile (Expo). Não entra na build web.

Os arquivos de deploy (`Dockerfile`, `nginx.conf`, `docker-compose.yml`, `.dockerignore`)
ficam na **raiz** do repositório, não na subpasta do app web.

## Comandos

Todos os comandos npm rodam dentro de `Jogo_da_Memoria_React/`:

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build        # tsc --noEmit && vite build (base "/")
npm run typecheck
npm run test         # node --test: imagens locais + build offline
npm run build:pages  # base "/Jogo_da_Memoria_React/" para GitHub Pages
npm run deploy       # publica no gh-pages
```

## Imagens das cartas

- As 21 faces ficam em `Jogo_da_Memoria_React/src/assets/cards/card-NN.webp`
  (512×512, WebP q82, ~470 KB no total). `src/data/cardFaces.ts` só importa esses
  arquivos — **nunca reintroduza hotlink** de freepik/ftcdn/dooca. O teste
  `tests/cardAssets.test.mjs` falha se aparecer URL externa.
- A origem e o licenciamento de cada arquivo estão em
  `src/assets/cards/CREDITS.md`; o README aponta para lá.
- Offline: `public/sw.js` pré-carrega os arquivos listados em
  `dist/precache-manifest.json`, gerado pelo plugin `precacheManifest` em
  `vite.config.ts`. O registro acontece só em produção (`import.meta.env.PROD`)
  para não quebrar o HMR. Se adicionar um asset novo que precisa funcionar
  offline, ele entra no manifesto automaticamente (é gerado a partir do bundle).

## Build e deploy (Docker / Coolify)

- **Contexto de build = raiz do repositório.** O Coolify usa a raiz por padrão.
  Por isso o `Dockerfile` está na raiz e referencia `Jogo_da_Memoria_React/...`.
- **Base directory no Coolify:** vazio (raiz). **Dockerfile location:** `/Dockerfile`.
- O `base` do Vite é `/` por padrão; use `VITE_BASE_PATH` para sobrescrever.
- Imagem: build com `node:26-alpine`, runtime com `nginx:1.27-alpine`.

### Armadilhas já encontradas (não repetir)

1. **Healthcheck não pode usar `localhost`.** O `wget` do BusyBox (Alpine) resolve
   `localhost` para IPv6 (`::1`), mas o nginx escuta só IPv4 — o healthcheck retorna 1
   para sempre, o container fica `unhealthy` e o Coolify aborta o deploy com
   "New container is unhealthy". Use sempre `http://127.0.0.1/`.
2. **Dockerfile fora da raiz quebra o deploy.** Com o contexto na raiz, `COPY package.json`
   falha ("not found") se o Dockerfile mora na subpasta. Mantenha na raiz.
3. **Placeholders do Coolify** (ex.: `php artisan migrate`, watch path `src/pages/**`,
   custom docker options) são só exemplos de template — não são valores salvos.
4. **`sw.js` e `precache-manifest.json` precisam de `no-cache`.** O `nginx.conf` serve
   `/assets/` como `immutable` por 1 ano; se o service worker cair nesse cache o
   navegador fica preso numa versão antiga do jogo. Por isso existem `location = /sw.js`
   e `location = /precache-manifest.json` com `Cache-Control: no-cache`.

## Versionamento

- Commits em nome de `SteveSilvas <steve.evets00@gmail.com>`, **sem tags de IA**.
