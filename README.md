# Jogo da Memória

Jogo da memória para **dois jogadores ou um jogador contra o computador**, feito
com **React + TypeScript + Vite**. Cada jogador tenta encontrar mais pares de
cartas do que o adversário.

🔗 **Jogue online:** https://SteveSilvas.github.io/Jogo_da_Memoria_React/

## Funcionalidades

- Tela inicial para escolher entre 1 jogador (contra o computador) e 2 jogadores, informar os nomes e a quantidade de cartas (10, 20, 30 ou 40).
- No modo 1 jogador, o computador memoriza as cartas que já viu, joga com um atraso curto e tem chance de esquecer parte das posições — ele não lê cartas nunca viradas.
- Tabuleiro embaralhado a cada partida, com cartas viradas com animação 3D.
- Turnos alternados: acertou um par, continua jogando; errou, passa a vez.
- Placar lateral com pontuação e pares conquistados de cada jogador, destacando quem está jogando.
- Feedback visual para pares encontrados e efeitos sonoros de virar carta, acerto e vitória.
- Painel de fim de jogo com o vencedor (ou empate) e opções para reiniciar ou voltar ao início.
- Layout responsivo para desktop, tablet e celular.

## Tecnologias

- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)
- [gh-pages](https://www.npmjs.com/package/gh-pages) para publicação no GitHub Pages

## Pré-requisitos

- [Node.js](https://nodejs.org/) `26.13.1` (LTS "Lithium") ou superior
- npm (já vem com o Node.js)

## Como rodar

```bash
# entrar na pasta do projeto web
cd Jogo_da_Memoria_React

# instalar as dependências
npm install

# iniciar o servidor de desenvolvimento
npm run dev
```

Abra o endereço mostrado no terminal (por padrão, `http://localhost:5173/`).

## Scripts disponíveis

| Comando              | Descrição                                                          |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Inicia o servidor de desenvolvimento com recarregamento automático |
| `npm run build`      | Verifica os tipos e gera a versão de produção em `dist/`           |
| `npm run build:pages`| Build com o subcaminho do GitHub Pages                              |
| `npm run preview`    | Serve localmente a versão de produção já gerada                    |
| `npm run typecheck`  | Apenas verifica os tipos TypeScript                                 |
| `npm test`           | Roda a suíte de testes (Vitest)                                     |
| `npm run deploy`     | Publica a pasta `dist/` no GitHub Pages                             |

## Estrutura do projeto

```
Jogo_da_Memoria_React/                    # raiz do repositório
├── Dockerfile              # Build multi-stage + nginx (contexto = raiz)
├── docker-compose.yml      # Compose pronto para o Coolify
├── nginx.conf              # Servidor estático com fallback de SPA
├── .dockerignore
├── README.md
├── JogoDaMemoria_ReactNative/          # versão mobile (Expo)
└── Jogo_da_Memoria_React/              # app web (React + Vite)
    ├── public/                 # Arquivos estáticos
    └── src/
        ├── @Types/             # Tipos compartilhados (carta, configuração do jogo)
        ├── assets/             # Imagens e efeitos sonoros
        ├── components/         # Componentes reutilizáveis
        │   ├── Card/           # Carta individual
        │   ├── Scoreboard/     # Placar do jogador
        │   └── WinnerPanel/    # Painel de fim de jogo
        ├── data/               # Lista de imagens usadas nas cartas
        ├── features/           # Telas e lógica principal
        │   ├── init/           # Orquestra a troca entre formulário e tabuleiro
        │   ├── initForm/       # Tela inicial (nomes e quantidade de cartas)
        │   └── board/          # Tabuleiro e regras do jogo
        ├── utils/              # Funções auxiliares (embaralhar, som)
        ├── App.tsx
        └── main.tsx
```

## Como jogar

1. Escolha o modo (1 jogador contra o computador ou 2 jogadores), informe o(s) nome(s) e a quantidade de cartas.
2. Clique em **Jogar** para começar.
3. Na sua vez, vire duas cartas:
   - Se formarem um par, você marca um ponto e joga de novo.
   - Se forem diferentes, elas voltam a ficar viradas para baixo e a vez passa para o outro jogador.
4. Vence quem conquistar mais pares até que todas as cartas sejam encontradas.

## Deploy com Docker (Coolify)

O projeto inclui `Dockerfile` e `docker-compose.yml` **na raiz do repositório**, prontos para o [Coolify](https://coolify.io/).
A build usa o `base` do Vite como `/` (raiz do domínio), ideal para um domínio próprio.

> ⚠️ O `Dockerfile` fica na **raiz** de propósito: assim o contexto de build é a raiz do
> repositório (padrão do Coolify) e ele encontra `Dockerfile`, `nginx.conf` e a subpasta
> `Jogo_da_Memoria_React/` sem configuração extra.

1. Suba o repositório para o GitHub/GitLab que o Coolify acessa.
2. No Coolify: **+ New Resource → Public Repository** (ou *Private Repository*) e selecione o repositório.
3. Em **Build Pack**, escolha **Dockerfile** (ou **Docker Compose**).
4. **Base Directory:** deixe **vazio** (raiz do repositório). *Não* coloque `Jogo_da_Memoria_React` aqui.
5. **Dockerfile Location:** `/Dockerfile` (padrão).
6. Em **Ports Exposes**, informe `80` (porta do nginx do container).
7. Em **Domains**, coloque seu domínio (ex.: `https://jogo.seudominio.com`) e ative o HTTPS.
8. Clique em **Deploy**. A cada `git push` o Coolify reconstrói e publica automaticamente.

### Testar localmente antes

```bash
docker build -t jogo-da-memoria .
docker run --rm -p 8080:80 jogo-da-memoria
# acesse http://localhost:8080
```

Ou com compose:

```bash
docker compose up --build
```

> Observação: o `docker-compose.yml` não fixa `ports` de propósito — o Coolify faz o roteamento
> pelo proxy dele usando a variável `SERVICE_FQDN_JOGODAMEMORIA_80`.

## Deploy no GitHub Pages

O deploy no Pages continua funcionando, mas agora usando o script dedicado que aplica o
subcaminho correto:

```bash
cd Jogo_da_Memoria_React
npm run deploy
```

O `npm run deploy` executa `build:pages` (com `VITE_BASE_PATH=/Jogo_da_Memoria_React/`) e envia
o conteúdo para a branch `gh-pages`.

## Projeto mobile (React Native)

A pasta `JogoDaMemoria_ReactNative/` contém uma versão experimental em React Native com Expo.
Para rodá-la:

```bash
cd JogoDaMemoria_ReactNative
npm install
npm start
```

## Licença

Uso livre para fins de estudo e portfólio.
