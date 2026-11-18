# Jogo da Memória

Jogo da memória para dois jogadores, feito com **React + TypeScript + Vite**.
Cada jogador tenta encontrar mais pares de cartas do que o adversário.

🔗 **Jogue online:** https://SteveSilvas.github.io/Jogo_da_Memoria_React/

## Funcionalidades

- Tela inicial para informar os nomes dos dois jogadores e a quantidade de cartas (10, 20, 30 ou 40).
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

- [Node.js](https://nodejs.org/) `^20.19.0` ou `>=22.12.0`
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

Abra o endereço mostrado no terminal (por padrão, `http://localhost:5173/Jogo_da_Memoria_React/`).

## Scripts disponíveis

| Comando             | Descrição                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Inicia o servidor de desenvolvimento com recarregamento automático |
| `npm run build`     | Verifica os tipos e gera a versão de produção em `dist/`          |
| `npm run preview`   | Serve localmente a versão de produção já gerada                   |
| `npm run typecheck` | Apenas verifica os tipos TypeScript                               |
| `npm run deploy`    | Publica a pasta `dist/` no GitHub Pages                           |

## Estrutura do projeto

```
Jogo_da_Memoria_React/
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

1. Informe o nome dos dois jogadores e escolha a quantidade de cartas.
2. Clique em **Jogar** para começar.
3. Na sua vez, vire duas cartas:
   - Se formarem um par, você marca um ponto e joga de novo.
   - Se forem diferentes, elas voltam a ficar viradas para baixo e a vez passa para o outro jogador.
4. Vence quem conquistar mais pares até que todas as cartas sejam encontradas.

## Deploy no GitHub Pages

O projeto já está configurado com o caminho base `/Jogo_da_Memoria_React/`.
Para publicar:

```bash
cd Jogo_da_Memoria_React
npm run deploy
```

O comando gera a build e envia o conteúdo para a branch `gh-pages`.

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
