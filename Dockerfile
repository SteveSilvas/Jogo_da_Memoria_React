# ---- Etapa de build ----
FROM node:26-alpine AS build

WORKDIR /app

# O app React fica na subpasta Jogo_da_Memoria_React/
# Instala as dependências usando o lockfile (build reproduzível)
COPY Jogo_da_Memoria_React/package.json Jogo_da_Memoria_React/package-lock.json ./
RUN npm ci

# Copia o código e gera a build de produção (base "/" para servir na raiz do domínio)
COPY Jogo_da_Memoria_React/ ./
RUN npm run build

# ---- Etapa de produção (nginx) ----
FROM nginx:1.27-alpine AS runtime

# Configuração do nginx com fallback de SPA e cache de assets
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os arquivos estáticos gerados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
