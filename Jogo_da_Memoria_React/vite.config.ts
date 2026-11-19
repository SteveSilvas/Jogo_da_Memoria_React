import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_SITE_ORIGIN = "https://SteveSilvas.github.io";

const basePath = process.env.VITE_BASE_PATH ?? "/";

// Lista os arquivos emitidos para o service worker pre-carregar tudo na instalacao,
// o que garante o jogo offline ja no primeiro acesso.
const precacheManifest = (): Plugin => ({
    name: "precache-manifest",
    apply: "build",
    generateBundle(_options, bundle) {
        const emitted = Object.keys(bundle).filter(
            (file) => file !== "precache-manifest.json",
        );
        const files = emitted.includes("index.html")
            ? emitted
            : ["index.html", ...emitted];
        this.emitFile({
            type: "asset",
            fileName: "precache-manifest.json",
            source: JSON.stringify(files),
        });
    },
});

// Redes sociais nao resolvem caminho relativo em og:image/twitter:image, entao as
// URLs absolutas sao montadas aqui com a origem do build e o `base` configurado.
// Defina VITE_SITE_URL com a origem publica (sem barra final).
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
    // "/" serve na raiz do dominio (Coolify/nginx).
    // Defina VITE_BASE_PATH para publicar em um subcaminho (ex.: GitHub Pages).
    base: basePath,
    plugins: [react(), absoluteSocialUrls(), precacheManifest()],
    preview: {
        host: true,
        port: 4173,
    },
});
