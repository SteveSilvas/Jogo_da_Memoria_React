import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(appRoot, "src");
const cardsDir = path.join(srcDir, "assets", "cards");
const facesFile = path.join(srcDir, "data", "cardFaces.ts");

const readFacesSource = () => readFile(facesFile, "utf8");

const localFaceImports = (source) =>
    [...source.matchAll(/from\s+"(\.\.\/assets\/cards\/[^"]+)"/g)].map((m) => m[1]);

const remoteUrls = (text) => [...text.matchAll(/https?:\/\/[^\s"'`()]+/g)].map((m) => m[0]);

// og:url e og:image precisam de URL absoluta, entao a origem do proprio site
// aparece no HTML gerado; qualquer outro host continua sendo hotlink.
const thirdPartyUrls = (text) =>
    remoteUrls(text).filter(
        (url) => !/^https?:\/\/(stevesilvas\.github\.io)(\/|$)/i.test(url),
    );

const webpDimensions = (buffer) => {
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF", "not a RIFF file");
    assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP", "not a WebP file");

    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
        return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
    if (chunk === "VP8 ") {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    throw new Error(`unexpected WebP chunk: ${chunk}`);
};

describe("card faces are served locally", () => {
    it("imports 21 local assets and keeps no third-party hotlink", async () => {
        const source = await readFacesSource();

        assert.equal(localFaceImports(source).length, 21);
        assert.deepEqual(remoteUrls(source), []);
        assert.doesNotMatch(source, /freepik|ftcdn|dooca/i);
    });

    it("lists every imported asset in CARD_FACES", async () => {
        const source = await readFacesSource();
        const imported = localFaceImports(source);
        const facesBlock = source.slice(source.indexOf("CARD_FACES"), source.indexOf("CARD_BACK"));
        const entries = [...facesBlock.matchAll(/^\s{4}(\w+),$/gm)].map((m) => m[1]);

        assert.equal(entries.length, 21);
        assert.equal(new Set(entries).size, 21);
        assert.equal(new Set(imported).size, 21);
    });

    it("ships each face as an optimized 512px WebP file", async () => {
        const source = await readFacesSource();
        const files = localFaceImports(source).map((specifier) =>
            path.resolve(srcDir, "data", specifier),
        );

        for (const file of files) {
            const { size } = await stat(file);
            assert.ok(size > 0, `${file} is empty`);
            assert.ok(size < 100 * 1024, `${file} is heavier than 100 KB`);

            const { width, height } = webpDimensions(await readFile(file));
            assert.equal(width, 512, `${file} width`);
            assert.equal(height, 512, `${file} height`);
        }
    });

    it("keeps the cards directory free of stray images", async () => {
        const files = (await readdir(cardsDir))
            .filter((name) => !name.endsWith(".md"))
            .sort();
        const expected = Array.from(
            { length: 21 },
            (_, index) => `card-${String(index + 1).padStart(2, "0")}.webp`,
        );

        assert.deepEqual(files, expected);
    });

    it("references no external domain from markup, styles or scripts", async () => {
        const entries = await readdir(srcDir, { recursive: true, withFileTypes: true });
        const sources = entries.filter(
            (entry) => entry.isFile() && /\.(tsx?|css|html)$/.test(entry.name),
        );

        assert.ok(sources.length > 0, "no source files found");

        for (const entry of sources) {
            const file = path.join(entry.parentPath, entry.name);
            assert.deepEqual(remoteUrls(await readFile(file, "utf8")), [], `${file} has remote URLs`);
        }

        for (const file of [path.join(appRoot, "index.html"), path.join(appRoot, "public", "sw.js")]) {
            assert.deepEqual(remoteUrls(await readFile(file, "utf8")), [], `${file} has remote URLs`);
        }
    });

    it("registers a service worker so the game runs offline", async () => {
        const sw = await readFile(path.join(appRoot, "public", "sw.js"), "utf8");
        assert.match(sw, /addEventListener\("install"/);
        assert.match(sw, /precache-manifest\.json/);

        const main = await readFile(path.join(srcDir, "main.tsx"), "utf8");
        assert.match(main, /serviceWorker\.register/);
        assert.match(main, /import\.meta\.env\.PROD/, "dev server must not install the worker");
    });

    it("emits the faces into the production build", async () => {
        const outDir = await mkdtemp(path.join(tmpdir(), "jogo-da-memoria-build-"));

        try {
            await execFileAsync(
                process.execPath,
                [path.join(appRoot, "node_modules", "vite", "bin", "vite.js"), "build", "--outDir", outDir, "--logLevel", "error"],
                { cwd: appRoot },
            );

            const emitted = await readdir(path.join(outDir, "assets"));
            const cardBundles = emitted.filter((file) => /^card-\d{2}-.+\.webp$/.test(file));
            assert.equal(cardBundles.length, 21, `emitted: ${emitted.join(", ")}`);

            const distRoot = await readdir(outDir);
            assert.ok(distRoot.includes("sw.js"), "service worker missing from build");
            assert.ok(distRoot.includes("precache-manifest.json"), "precache manifest missing from build");

            const manifest = JSON.parse(
                await readFile(path.join(outDir, "precache-manifest.json"), "utf8"),
            );
            assert.ok(manifest.includes("index.html"), "index.html must be precached");
            assert.equal(
                manifest.filter((file) => /^assets\/card-\d{2}-.+\.webp$/.test(file)).length,
                21,
                "every card must be precached",
            );

            for (const file of ["index.html", ...emitted.filter((name) => name.endsWith(".css"))]) {
                const content = await readFile(path.join(file === "index.html" ? outDir : path.join(outDir, "assets"), file), "utf8");
                assert.deepEqual(thirdPartyUrls(content), [], `${file} still requests a third-party host`);
            }
        } finally {
            await rm(outDir, { recursive: true, force: true });
        }
    });
});
