import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Origem usada nas metas sociais quando VITE_SITE_URL não é definido.
const DEFAULT_SITE_URL = "https://stevesilvas.github.io";
const SOCIAL_IMAGE = "og-image.jpg";

/**
 * Redes sociais não resolvem caminho relativo em og:image/og:url, e a imagem
 * precisa mudar de acordo com o `base` (raiz no Coolify, subcaminho no Pages).
 * Por isso as URLs absolutas são montadas aqui, no build, em vez de fixadas
 * no index.html.
 */
function socialMeta(): Plugin {
    let base = "/";
    let publicDir = "";
    let siteUrl = DEFAULT_SITE_URL;

    return {
        name: "jogo-da-memoria:social-meta",
        configResolved(config) {
            base = config.base.endsWith("/") ? config.base : `${config.base}/`;
            publicDir = config.publicDir;

            const configured = config.env.VITE_SITE_URL;
            siteUrl = String(configured || DEFAULT_SITE_URL).replace(/\/+$/, "");

            if (!/^https?:\/\//.test(siteUrl)) {
                config.logger.warn(
                    `VITE_SITE_URL deve ser uma URL absoluta (ex.: https://jogo.seudominio.com). Recebido: "${siteUrl}".`
                );
            } else if (!configured && config.command === "build") {
                config.logger.warn(
                    `VITE_SITE_URL não definido: og:url e og:image apontam para ${siteUrl}. ` +
                        "Defina o domínio público para o preview social ficar correto."
                );
            }
        },
        transformIndexHtml: {
            order: "pre",
            handler(html) {
                if (!existsSync(resolve(publicDir, SOCIAL_IMAGE))) {
                    throw new Error(`Imagem social ausente: public/${SOCIAL_IMAGE}`);
                }

                return html
                    .replaceAll("%SITE_URL%", `${siteUrl}${base}`)
                    .replaceAll("%SITE_IMAGE_URL%", `${siteUrl}${base}${SOCIAL_IMAGE}`);
            },
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    // "/" serve na raiz do domínio (Coolify/nginx).
    // Defina VITE_BASE_PATH para publicar em um subcaminho (ex.: GitHub Pages).
    base: process.env.VITE_BASE_PATH ?? "/",
    plugins: [react(), socialMeta()],
    preview: {
        host: true,
        port: 4173,
    },
});
