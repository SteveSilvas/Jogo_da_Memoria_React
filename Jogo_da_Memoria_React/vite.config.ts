import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Lista os arquivos emitidos para o service worker pré-carregar tudo na instalação,
// o que garante o jogo offline já no primeiro acesso.
const precacheManifest = (): Plugin => ({
    name: "precache-manifest",
    apply: "build",
    generateBundle(_options, bundle) {
        const emitted = Object.keys(bundle).filter((file) => file !== "precache-manifest.json");
        const files = emitted.includes("index.html") ? emitted : ["index.html", ...emitted];
        this.emitFile({
            type: "asset",
            fileName: "precache-manifest.json",
            source: JSON.stringify(files),
        });
    },
});

// https://vitejs.dev/config/
export default defineConfig({
    // "/" serve na raiz do domínio (Coolify/nginx).
    // Defina VITE_BASE_PATH para publicar em um subcaminho (ex.: GitHub Pages).
    base: process.env.VITE_BASE_PATH ?? "/",
    plugins: [react(), precacheManifest()],
    preview: {
        host: true,
        port: 4173,
    },
});
