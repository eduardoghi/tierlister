import type { TierRow } from '$lib/types';

export const DEFAULT_ROWS: Omit<TierRow, 'id' | 'items'>[] = [
    { label: 'S', color: '#ff7d7d' },
    { label: 'A', color: '#ffc58b' },
    { label: 'B', color: '#fff68a' },
    { label: 'C', color: '#83ff8e' },
    { label: 'D', color: '#8ff6ff' },
    { label: 'E', color: '#8b90ff' },
    { label: 'F', color: '#ff8bf2' }
];

export function createRowsFromDefaults(): TierRow[] {
    return DEFAULT_ROWS.map((row) => ({
        id: crypto.randomUUID(),
        label: row.label,
        color: row.color,
        items: []
    }));
}