import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    // "/" serve na raiz do domínio (Coolify/nginx).
    // Defina VITE_BASE_PATH para publicar em um subcaminho (ex.: GitHub Pages).
    base: process.env.VITE_BASE_PATH ?? "/",
    plugins: [react()],
    preview: {
        host: true,
        port: 4173,
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        restoreMocks: true,
    },
});
