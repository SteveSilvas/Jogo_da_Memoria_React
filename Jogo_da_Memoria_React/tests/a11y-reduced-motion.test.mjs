import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

const readCss = (relativePath) =>
    readFileSync(join(srcDir, relativePath), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Extracts the body of the first `@media (prefers-reduced-motion: reduce)` block. */
const reducedMotionBlock = (css) => {
    const marker = css.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.notEqual(marker, -1, "arquivo não tem bloco prefers-reduced-motion");
    const open = css.indexOf("{", marker);
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
        if (css[i] === "{") depth += 1;
        if (css[i] === "}") {
            depth -= 1;
            if (depth === 0) return css.slice(open + 1, i);
        }
    }
    throw new Error("bloco @media não fechado");
};

/** Parses `selector { decls }` pairs into [{ selector, decls }], one entry per selector. */
const parseRules = (css) => {
    const rules = [];
    const pattern = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = pattern.exec(css)) !== null) {
        for (const selector of match[1].split(",")) {
            rules.push({
                selector: selector.trim().replace(/\s+/g, " "),
                decls: match[2],
            });
        }
    }
    return rules;
};

const decl = (rule, property) => {
    const found = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i").exec(
        `;${rule.decls}`,
    );
    return found ? found[1].trim() : null;
};

const ruleFor = (rules, selector) => {
    const matches = rules.filter((r) => r.selector === selector);
    assert.ok(matches.length > 0, `regra "${selector}" não encontrada`);
    return { selector, decls: matches.map((r) => r.decls).join(";") };
};

const channelLuminance = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex) => {
    const clean = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
    return (
        0.2126 * channelLuminance(r) +
        0.7152 * channelLuminance(g) +
        0.0722 * channelLuminance(b)
    );
};

const contrastRatio = (a, b) => {
    const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
        (x, y) => y - x,
    );
    return (light + 0.05) / (dark + 0.05);
};

describe("card.css", () => {
    const css = readCss("components/Card/card.css");
    const rules = parseRules(css);

    test("flip 3D continua revelando a face (sem regressão)", () => {
        const flipped = ruleFor(rules, ".Card.is-flipped .Card-inner");
        assert.match(decl(flipped, "transform"), /rotateY\(180deg\)/);
    });

    test("fora do modo reduzido o flip e o hover animam normalmente", () => {
        assert.ok(decl(ruleFor(rules, ".Card-inner"), "transition"));
        assert.equal(
            decl(ruleFor(rules, ".Card:not(:disabled):hover"), "transform"),
            "translateY(-4px)",
        );
    });

    test("movimento reduzido: transições e animações desligadas", () => {
        const reduced = parseRules(reducedMotionBlock(css));
        assert.equal(decl(ruleFor(reduced, ".Card-inner"), "transition"), "none");
        assert.equal(decl(ruleFor(reduced, ".Card"), "transition"), "none");
        assert.equal(decl(ruleFor(reduced, ".Card.is-matched"), "animation"), "none");
    });

    test("movimento reduzido: hover não desloca a carta", () => {
        const reduced = parseRules(reducedMotionBlock(css));
        assert.equal(
            decl(ruleFor(reduced, ".Card:not(:disabled):hover"), "transform"),
            "none",
        );
    });

    test("movimento reduzido: não zera o transform de flip/matched", () => {
        const reduced = reducedMotionBlock(css);
        assert.doesNotMatch(reduced, /\.Card\.is-flipped/);
        assert.doesNotMatch(reduced, /\.Card\.is-matched\s+\.Card-inner/);
    });

    test("foco visível: outline >= 3px, offset e halo de contraste", () => {
        const focus = ruleFor(rules, ".Card:focus-visible");
        const width = /(\d+(?:\.\d+)?)px/.exec(decl(focus, "outline"))?.[1];
        assert.ok(Number(width) >= 3, `outline de ${width}px é menor que 3px`);
        assert.ok(decl(focus, "outline-offset"), "falta outline-offset");
        assert.ok(decl(focus, "box-shadow"), "falta box-shadow de reforço");
    });

    test("cor do outline tem contraste >= 3:1 nos dois fundos da carta", () => {
        const focus = ruleFor(rules, ".Card:focus-visible");
        const color = /#[0-9a-f]{6}/i.exec(decl(focus, "outline"))?.[0];
        assert.ok(color, "outline sem cor hexadecimal");
        for (const background of ["#2b2f6b", "#141634"]) {
            const ratio = contrastRatio(color, background);
            assert.ok(ratio >= 3, `${color} vs ${background} = ${ratio.toFixed(2)}:1`);
        }
    });
});

describe("winnerPanel.css", () => {
    const css = readCss("components/WinnerPanel/winnerPanel.css");
    const rules = parseRules(css);

    test("fora do modo reduzido o overlay anima com blur", () => {
        assert.ok(decl(ruleFor(rules, ".WinnerOverlay"), "animation"));
        assert.match(decl(ruleFor(rules, ".WinnerOverlay"), "backdrop-filter"), /blur/);
    });

    test("movimento reduzido: sem animação de entrada e sem blur", () => {
        const reduced = parseRules(reducedMotionBlock(css));
        const overlay = ruleFor(reduced, ".WinnerOverlay");
        assert.equal(decl(overlay, "animation"), "none");
        assert.equal(decl(overlay, "backdrop-filter"), "none");
        assert.equal(decl(overlay, "-webkit-backdrop-filter"), "none");
        assert.equal(decl(ruleFor(reduced, ".WinnerPanel"), "animation"), "none");
    });

    test("movimento reduzido: overlay ainda cobre a tela com fundo legível", () => {
        assert.match(decl(ruleFor(rules, ".WinnerOverlay"), "background"), /rgba/);
    });
});

describe("scoreboard.css", () => {
    const css = readCss("components/Scoreboard/scoreboard.css");
    const rules = parseRules(css);

    test("fora do modo reduzido o jogador ativo anima", () => {
        assert.ok(decl(ruleFor(rules, ".Scoreboard"), "transition"));
        assert.equal(
            decl(ruleFor(rules, ".Scoreboard.is-active"), "transform"),
            "translateY(-2px)",
        );
    });

    test("movimento reduzido: sem transição, sem deslocamento, sem animação", () => {
        const reduced = parseRules(reducedMotionBlock(css));
        assert.equal(decl(ruleFor(reduced, ".Scoreboard"), "transition"), "none");
        assert.equal(
            decl(ruleFor(reduced, ".Scoreboard.is-active"), "transform"),
            "none",
        );
        assert.equal(decl(ruleFor(reduced, ".Scoreboard-pair"), "animation"), "none");
    });

    test("movimento reduzido: destaque do jogador ativo continua visível", () => {
        const active = ruleFor(rules, ".Scoreboard.is-active");
        assert.equal(decl(active, "border-color"), "#38d39f");
        assert.match(decl(active, "box-shadow"), /rgba\(56, 211, 159/);
    });
});
