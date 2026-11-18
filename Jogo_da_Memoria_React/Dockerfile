# ---- Etapa de build ----
FROM node:22-alpine AS build

WORKDIR /app

# Instala as dependências usando o lockfile (build reproduzível)
COPY package.json package-lock.json ./
RUN npm ci

# Copia o código e gera a build de produção (base "/" para servir na raiz do domínio)
COPY . .
RUN npm run build

# ---- Etapa de produção (nginx) ----
FROM nginx:1.27-alpine AS runtime

# Configuração do nginx com fallback de SPA e cache de assets
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os arquivos estáticos gerados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
