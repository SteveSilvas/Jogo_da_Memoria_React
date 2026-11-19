import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CardType from "../../@Types/CardType";
import Card from "./Card";

const card = (overrides: Partial<CardType> = {}): CardType =>
    ({
        id: 1,
        face: "/faces/gato.png",
        flipped: false,
        matched: false,
        ...overrides,
    }) as CardType;

const renderCard = (overrides: Partial<CardType> = {}) => {
    const onSelect = vi.fn();
    render(
        <Card
            card={card(overrides)}
            back="/block.png"
            disabled={false}
            index={0}
            total={10}
            onSelect={onSelect}
        />,
    );
    return { onSelect, button: screen.getByRole("button") };
};

const faceImages = (button: HTMLElement) =>
    Array.from(button.querySelectorAll("img")).filter((img) =>
        img.getAttribute("src")?.includes("/faces/"),
    );

describe("Card: carregamento das faces", () => {
    it("nao renderiza a imagem da face com o tabuleiro virado", () => {
        const { button } = renderCard();
        expect(faceImages(button)).toHaveLength(0);
    });

    it("renderiza a face quando a carta esta revelada", () => {
        const { button } = renderCard({ flipped: true });
        const [image] = faceImages(button);
        expect(image).toBeDefined();
        expect(image.getAttribute("src")).toBe("/faces/gato.png");
    });

    it("renderiza a face quando o par foi encontrado", () => {
        const { button } = renderCard({ matched: true, flipped: true });
        expect(faceImages(button)).toHaveLength(1);
    });

    it("marca a face com loading lazy e decoding async", () => {
        const { button } = renderCard({ flipped: true });
        const [image] = faceImages(button);
        expect(image.getAttribute("loading")).toBe("lazy");
        expect(image.getAttribute("decoding")).toBe("async");
    });

    it("arma a face no hover, antes do clique", async () => {
        const user = userEvent.setup();
        const { button } = renderCard();

        await user.hover(button);
        expect(faceImages(button)).toHaveLength(1);
    });

    it("arma a face no foco por teclado", async () => {
        const user = userEvent.setup();
        const { button } = renderCard();

        await user.tab();
        expect(document.activeElement).toBe(button);
        expect(faceImages(button)).toHaveLength(1);
    });

    it("mantem o verso sempre presente", () => {
        const { button } = renderCard();
        const back = Array.from(button.querySelectorAll("img")).filter((img) =>
            img.getAttribute("src")?.includes("block.png"),
        );
        expect(back).toHaveLength(1);
    });

    it("nao dispara onSelect quando ja revelada", async () => {
        const user = userEvent.setup();
        const { onSelect, button } = renderCard({ flipped: true });

        await user.click(button);
        expect(onSelect).not.toHaveBeenCalled();
    });
});
