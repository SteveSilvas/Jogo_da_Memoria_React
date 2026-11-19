import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const html = readFileSync(resolve(root, "index.html"), "utf8");

const metaContent = (selector: string): string | undefined => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(
        new RegExp(
            `<meta\\s+(?:name|property)=["']${escaped}["']\\s+content=["']([^"']*)["']`,
        ),
    );
    return match?.[1];
};

describe("meta tags sociais", () => {
    it("tem description em portugues com tamanho util", () => {
        const description = metaContent("description");
        expect(description).toBeTruthy();
        expect(description!.length).toBeGreaterThan(70);
        expect(description!.length).toBeLessThan(200);
    });

    it("tem o conjunto completo de Open Graph", () => {
        for (const tag of [
            "og:type",
            "og:title",
            "og:description",
            "og:image",
            "og:url",
            "og:locale",
        ]) {
            expect(metaContent(tag), `faltou ${tag}`).toBeTruthy();
        }
        expect(metaContent("og:locale")).toBe("pt_BR");
        expect(metaContent("og:type")).toBe("website");
    });

    it("tem Twitter Card do tipo summary_large_image", () => {
        expect(metaContent("twitter:card")).toBe("summary_large_image");
        expect(metaContent("twitter:title")).toBeTruthy();
        expect(metaContent("twitter:description")).toBeTruthy();
        expect(metaContent("twitter:image")).toBeTruthy();
    });

    it("declara as dimensoes da imagem de preview", () => {
        expect(metaContent("og:image:width")).toBe("1200");
        expect(metaContent("og:image:height")).toBe("630");
    });

    it("descreve a imagem, sem alt vazio", () => {
        expect(metaContent("og:image:alt")?.trim()).toBeTruthy();
        expect(metaContent("twitter:image:alt")?.trim()).toBeTruthy();
    });

    it("usa theme-color igual ao fundo do tema", () => {
        expect(metaContent("theme-color")).toBe("#05061a");
    });

    it("monta og:url e og:image como URL absoluta via placeholder", () => {
        expect(metaContent("og:url")).toBe("%SITE_URL%");
        expect(metaContent("og:image")).toBe("%SITE_IMAGE%");
        expect(metaContent("twitter:image")).toBe("%SITE_IMAGE%");
    });

    it("a imagem referenciada existe em public/", () => {
        const file = resolve(root, "public/og-image.jpg");
        const { size } = statSync(file);
        expect(size).toBeGreaterThan(10_000);
        expect(size).toBeLessThan(200 * 1024);
    });
});
