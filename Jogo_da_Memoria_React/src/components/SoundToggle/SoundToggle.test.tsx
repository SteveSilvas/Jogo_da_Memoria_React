import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { setMuted } from "../../utils/soundPreferences";
import SoundToggle from "./SoundToggle";

const STORAGE_KEY = "jogo-da-memoria:muted";

describe("SoundToggle", () => {
    beforeEach(() => {
        window.localStorage.clear();
        setMuted(false);
    });

    it("comeca com som ligado e rotulo de desativar", () => {
        render(<SoundToggle />);
        const button = screen.getByRole("button", { name: "Desativar som" });
        expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("silencia ao clicar e persiste a preferencia", async () => {
        const user = userEvent.setup();
        render(<SoundToggle />);

        await user.click(screen.getByRole("button", { name: "Desativar som" }));

        const button = screen.getByRole("button", { name: "Ativar som" });
        expect(button).toHaveAttribute("aria-pressed", "true");
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("reativa o som ao clicar de novo", async () => {
        const user = userEvent.setup();
        setMuted(true);
        render(<SoundToggle />);

        await user.click(screen.getByRole("button", { name: "Ativar som" }));

        expect(
            screen.getByRole("button", { name: "Desativar som" }),
        ).toHaveAttribute("aria-pressed", "false");
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
    });

    it("reflete mudanca feita por outro consumidor", async () => {
        const user = userEvent.setup();
        render(<SoundToggle />);

        setMuted(true);

        const button = await screen.findByRole("button", { name: "Ativar som" });
        expect(button).toHaveAttribute("aria-pressed", "true");

        await user.click(button);
        expect(
            screen.getByRole("button", { name: "Desativar som" }),
        ).toHaveAttribute("aria-pressed", "false");
    });
});
