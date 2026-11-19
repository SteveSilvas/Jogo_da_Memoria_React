import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_SITE_ORIGIN = "https://SteveSilvas.github.io";

const basePath = process.env.VITE_BASE_PATH ?? "/";

/**
 * Redes sociais nao resolvem caminho relativo em og:image/twitter:image,
 * entao as URLs absolutas sao montadas aqui com a origem do build e o `base`
 * configurado. Defina VITE_SITE_URL com a origem publica (sem barra final).
 */
const absoluteSocialUrls = (): Plugin => ({
    name: "absolute-social-urls",
    transformIndexHtml(html) {
        const origin = (process.env.VITE_SITE_URL || DEFAULT_SITE_ORIGIN).replace(
            /\/+$/,
            "",
        );
        const url = new URL(basePath, origin).href;
        const image = new URL(
            `${basePath.replace(/\/+$/, "")}/og-image.jpg`,
            origin,
        ).href;

        return html
            .replaceAll("%SITE_URL%", url)
            .replaceAll("%SITE_IMAGE%", image);
    },
});

// https://vitejs.dev/config/
export default defineConfig({
    // "/" serve na raiz do domínio (Coolify/nginx).
    // Defina VITE_BASE_PATH para publicar em um subcaminho (ex.: GitHub Pages).
    base: basePath,
    plugins: [react(), absoluteSocialUrls()],
    preview: {
        host: true,
        port: 4173,
    },
});
