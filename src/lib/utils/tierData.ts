import type { TierRow } from '$lib/types';
import { createRowsFromDefaults } from '$lib/constants/tierDefaults';

export function normalizeItems(input: TierRow['items'] | undefined): TierRow['items'] {
    if (!Array.isArray(input)) return [];

    return input
        .filter((item) => typeof item?.url === 'string' && item.url.length > 0)
        .map((item) => ({
            id: crypto.randomUUID(),
            url: item.url,
            note: item.note ?? ''
        }));
}

export function normalizeRows(input: TierRow[] | undefined): TierRow[] {
    if (!Array.isArray(input)) return createRowsFromDefaults();

    return input.map((row) => ({
        id: crypto.randomUUID(),
        label: row?.label ?? '',
        color: row?.color ?? '#f0f0f0',
        items: normalizeItems(row?.items)
    }));
}