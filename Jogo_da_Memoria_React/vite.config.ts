import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    // Caminho base para o GitHub Pages (https://SteveSilvas.github.io/Jogo_da_Memoria_React/)
    base: "/Jogo_da_Memoria_React/",
    plugins: [react()],
});
