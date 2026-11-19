import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import Card from "./Card";
import CardType from "../../@Types/CardType";

const FACE = "https://example.com/face.jpg";
const BACK = "/block.svg";
const IMAGE_SIZE = "512";

const makeCard = (overrides: Partial<CardType> = {}): CardType => ({
    id: 1,
    face: FACE,
    back: BACK,
    flipped: false,
    matched: false,
    ...overrides,
});

const renderCard = (card: CardType) =>
    render(<Card card={card} back={BACK} disabled={false} onSelect={vi.fn()} />);

const faceImages = () =>
    Array.from(document.querySelectorAll<HTMLImageElement>(".Card-back .Card-image"));

const expectOptimisedImage = (img: HTMLImageElement, src: string) => {
    expect(img.getAttribute("src")).toBe(src);
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("width")).toBe(IMAGE_SIZE);
    expect(img.getAttribute("height")).toBe(IMAGE_SIZE);
};

describe("Card", () => {
    afterEach(cleanup);

    it("não renderiza a imagem da face enquanto a carta está virada para baixo", () => {
        renderCard(makeCard());

        expect(faceImages()).toHaveLength(0);
    });

    it("renderiza a face com lazy loading, decoding assíncrono e dimensões", () => {
        renderCard(makeCard({ flipped: true }));

        const [face] = faceImages();
        expect(face).toBeDefined();
        expectOptimisedImage(face, FACE);
    });

    it("usa as mesmas dicas de carregamento na imagem do verso", () => {
        renderCard(makeCard());

        const back = document.querySelector<HTMLImageElement>(".Card-front .Card-image");
        expect(back).not.toBeNull();
        expectOptimisedImage(back!, BACK);
    });

    it("pré-carrega a face ao passar o mouse e não a descarta ao sair", () => {
        const { container } = renderCard(makeCard());
        const button = container.querySelector("button")!;

        fireEvent.pointerEnter(button);
        expect(faceImages()).toHaveLength(1);

        fireEvent.pointerLeave(button);
        expect(faceImages()).toHaveLength(1);
    });

    it("pré-carrega a face ao focar a carta pelo teclado", () => {
        const { container } = renderCard(makeCard());

        fireEvent.focus(container.querySelector("button")!);

        expect(faceImages()).toHaveLength(1);
    });
});
