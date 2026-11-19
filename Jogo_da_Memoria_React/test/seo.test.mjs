import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const configFile = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
const DEFAULT_SITE_URL = "https://stevesilvas.github.io";
const DESCRIPTION =
    "Jogo da memória para dois jogadores: encontre mais pares de cartas que o adversário e mostre quem tem a melhor memória. Grátis, direto no navegador.";

let workDir;

before(async () => {
    workDir = await mkdtemp(join(tmpdir(), "jogo-seo-"));
});

after(async () => {
    delete process.env.VITE_SITE_URL;
    await rm(workDir, { recursive: true, force: true });
});

async function buildSite({ name, base, siteUrl }) {
    const outDir = join(workDir, name);
    if (siteUrl === undefined) delete process.env.VITE_SITE_URL;
    else process.env.VITE_SITE_URL = siteUrl;

    await build({ configFile, root, base, build: { outDir, emptyOutDir: true }, logLevel: "silent" });

    return { html: await readFile(join(outDir, "index.html"), "utf8"), outDir };
}

function metaContent(html, attribute, value) {
    const pattern = new RegExp(`<meta\\s+${attribute}="${value}"\\s+content="([^"]*)"`, "i");
    return html.match(pattern)?.[1];
}

function jpegSize(buffer) {
    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset += 1;
            continue;
        }
        const marker = buffer[offset + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
            return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
    }
    return null;
}

test("build na raiz (Coolify) gera metas sociais com URL absoluta", async () => {
    const { html, outDir } = await buildSite({ name: "root", base: "/" });

    assert.equal(metaContent(html, "name", "description"), DESCRIPTION);
    assert.equal(metaContent(html, "name", "theme-color"), "#05061a");

    assert.equal(metaContent(html, "property", "og:type"), "website");
    assert.equal(metaContent(html, "property", "og:locale"), "pt_BR");
    assert.equal(metaContent(html, "property", "og:title"), "Jogo da Memória — jogue com um amigo");
    assert.equal(metaContent(html, "property", "og:description"), DESCRIPTION);
    assert.equal(metaContent(html, "property", "og:url"), `${DEFAULT_SITE_URL}/`);
    assert.equal(metaContent(html, "property", "og:image"), `${DEFAULT_SITE_URL}/og-image.jpg`);
    assert.equal(metaContent(html, "property", "og:image:width"), "1200");
    assert.equal(metaContent(html, "property", "og:image:height"), "630");
    assert.ok(metaContent(html, "property", "og:image:alt").length > 20);

    assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image");
    assert.equal(metaContent(html, "name", "twitter:title"), "Jogo da Memória — jogue com um amigo");
    assert.equal(metaContent(html, "name", "twitter:description"), DESCRIPTION);
    assert.equal(metaContent(html, "name", "twitter:image"), `${DEFAULT_SITE_URL}/og-image.jpg`);
    assert.ok(metaContent(html, "name", "twitter:image:alt").length > 20);

    assert.ok(!html.includes("%SITE_"), "nenhum placeholder de URL deve sobrar no HTML final");

    const imagePath = join(outDir, "og-image.jpg");
    assert.deepEqual(jpegSize(await readFile(imagePath)), { width: 1200, height: 630 });
    assert.ok((await stat(imagePath)).size < 200 * 1024, "imagem social deve ficar abaixo de 200 KB");
});

test("build em subcaminho (GitHub Pages) respeita o base e o VITE_SITE_URL", async () => {
    const { html, outDir } = await buildSite({
        name: "pages",
        base: "/Jogo_da_Memoria_React/",
        siteUrl: "https://example.com/",
    });

    const pageUrl = "https://example.com/Jogo_da_Memoria_React/";

    assert.equal(metaContent(html, "property", "og:url"), pageUrl);
    assert.equal(metaContent(html, "property", "og:image"), `${pageUrl}og-image.jpg`);
    assert.equal(metaContent(html, "name", "twitter:image"), `${pageUrl}og-image.jpg`);
    assert.ok(!html.includes("%SITE_"), "nenhum placeholder de URL deve sobrar no HTML final");

    assert.deepEqual(jpegSize(await readFile(join(outDir, "og-image.jpg"))), { width: 1200, height: 630 });
});
