export const plural = (count: number, singular: string, plural: string): string =>
    `${count} ${count === 1 ? singular : plural}`;

export const pairCountLabel = (count: number): string =>
    plural(count, "par", "pares");

export const foundCountLabel = (count: number): string =>
    plural(count, "encontrado", "encontrados");

export const progressLabel = (found: number, total: number): string =>
    `${plural(found, "par encontrado", "pares encontrados")} de ${total}`;
