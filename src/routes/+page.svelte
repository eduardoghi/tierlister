<script lang="ts">
    import Download from '@lucide/svelte/icons/download';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import Upload from '@lucide/svelte/icons/upload';
    import Settings from '@lucide/svelte/icons/settings';
    import ChevronUp from '@lucide/svelte/icons/chevron-up';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';

    import type { TierRow } from '$lib/types';
    import type { TierZoneChangePayload } from '$lib/components/TierZone.svelte';
    import { createRowsFromDefaults } from '$lib/constants/tierDefaults';
    import { normalizeItems, normalizeRows } from '$lib/utils/tierData';
    import { saveTierlistElementAsPng } from '$lib/utils/exportImage';
    import TierZone from '$lib/components/TierZone.svelte';
    import GlobalActionsModal from '$lib/components/GlobalActionsModal.svelte';
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';
    import RowSettingsModal from '$lib/components/RowSettingsModal.svelte';
    import { onMount } from 'svelte';
    import { save } from '@tauri-apps/plugin-dialog';
    import { writeTextFile } from '@tauri-apps/plugin-fs';

    let boardEl: HTMLElement | null = null;

    async function saveTierlistImage() {
        await saveTierlistElementAsPng(boardEl);
    }

    function moveRow(index: number, delta: -1 | 1) {
        const to = index + delta;

        if (to < 0 || to >= rows.length) return;

        const [r] = rows.splice(index, 1);
        rows.splice(to, 0, r);
    }

    function focusRowLabel(rowId: string) {
        const span = document.querySelector(
            `.tier-square[data-row-id="${rowId}"] [contenteditable="true"]`
        ) as HTMLSpanElement | null;

        if (!span) return;

        span.focus();

        const sel = window.getSelection?.();
        if (!sel) return;

        const range = document.createRange();
        range.selectNodeContents(span);
        range.collapse(false);

        sel.removeAllRanges();
        sel.addRange(range);
    }

    let rows = $state<TierRow[]>(createRowsFromDefaults());

    const OUTSIDE_ZONE_ID = 'outside-area';
    let outsideItems = $state<TierRow['items']>([]);

    type RowSettingsHandle = {
        open: (row: TierRow, index: number) => Promise<void>;
    };

    let modalRef: RowSettingsHandle | null = null;
    let rowIndexEditing = -1;

    function openRowSettings(row: TierRow, idx: number) {
        rowIndexEditing = idx;
        modalRef?.open(row, idx);
    }

    function applyRowSettings(patch: Partial<TierRow>) {
        if (rowIndexEditing < 0) return;

        if (patch.label != null) {
            rows[rowIndexEditing].label = patch.label;
        }

        if (patch.color != null) {
            rows[rowIndexEditing].color = patch.color;
        }

        rowIndexEditing = -1;
    }

    let selectedRowId = $state<string | null>(null);

    let isDragging = $state(false);
    let isTrashOver = $state(false);

    onMount(() => {
        let down = false;
        let sx = 0;
        let sy = 0;

        const handleDown = (e: PointerEvent) => {
            const t = e.target as HTMLElement;

            if (!t.closest('.tier-square') && !t.closest('[data-role="trash"]')) {
                selectedRowId = null;
            }

            if ((e.buttons & 1) === 1) {
                down = true;
                sx = e.clientX;
                sy = e.clientY;
            }
        };

        const handleMove = (e: PointerEvent) => {
            if (!down) return;

            const dx = Math.abs(e.clientX - sx);
            const dy = Math.abs(e.clientY - sy);

            if (!isDragging && (dx > 6 || dy > 6)) {
                isDragging = true;
            }
        };

        const endAll = () => {
            down = false;
            isDragging = false;
            isTrashOver = false;
        };

        const handleFocusIn = (e: FocusEvent) => {
            const t = e.target as HTMLElement | null;

            if (!t?.closest('.tier-square') && !t?.closest('[data-role="trash"]')) {
                selectedRowId = null;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                selectedRowId = null;

                const ae = document.activeElement as HTMLElement | null;
                if (ae?.closest('.tier-square')) {
                    ae.blur();
                }

                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (!e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            if (!selectedRowId) return;

            const idx = rows.findIndex((r) => r.id === selectedRowId);
            if (idx === -1) return;

            const delta: -1 | 1 = e.key === 'ArrowUp' ? -1 : 1;
            const to = idx + delta;

            if (to < 0 || to >= rows.length) return;

            e.preventDefault();
            moveRow(idx, delta);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    focusRowLabel(selectedRowId!);
                });
            });
        };

        window.addEventListener('pointerdown', handleDown, { capture: true });
        window.addEventListener('pointermove', handleMove, { capture: true });
        window.addEventListener('pointerup', endAll, { capture: true });
        window.addEventListener('pointercancel', endAll, { capture: true });
        window.addEventListener('drop', endAll, { capture: true });
        window.addEventListener('focusin', handleFocusIn, { capture: true });
        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('pointerdown', handleDown, { capture: true });
            window.removeEventListener('pointermove', handleMove, { capture: true });
            window.removeEventListener('pointerup', endAll, { capture: true });
            window.removeEventListener('pointercancel', endAll, { capture: true });
            window.removeEventListener('drop', endAll, { capture: true });
            window.removeEventListener('focusin', handleFocusIn, { capture: true });
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    });

    function createRow(label = '', color = '#f0f0f0'): TierRow {
        return {
            id: crypto.randomUUID(),
            label,
            color,
            items: []
        };
    }

    function deleteAllItems() {
        rows.forEach((r) => {
            r.items = [];
        });

        outsideItems = [];
    }

    function moveAllItemsToOutside() {
        const allItems: TierRow['items'] = [];

        rows.forEach((r) => {
            if (r.items?.length) {
                allItems.push(...r.items);
                r.items = [];
            }
        });

        if (allItems.length) {
            outsideItems = [...outsideItems, ...allItems];
        }
    }

    function resetBoard() {
        moveAllItemsToOutside();
        rows = createRowsFromDefaults();
        selectedRowId = null;
    }

    type GlobalActionsHandle = {
        open: () => void;
    };

    let globalActionsModal: GlobalActionsHandle | null = null;

    async function exportBoard() {
        const payload = JSON.stringify({ rows, outside: outsideItems }, null, 2);
        const suggested = `tierlist-${new Date().toISOString().slice(0, 10)}.json`;

        try {
            const filePath = await save({
                defaultPath: suggested,
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!filePath) return;

            const finalPath = filePath.endsWith('.json') ? filePath : `${filePath}.json`;

            await writeTextFile(finalPath, payload);
            return;
        } catch (err) {
            console.error('Falha no export via Tauri v2:', err);
        }

        const blob = new Blob([payload], { type: 'application/json' });
        const a = document.createElement('a');

        a.href = URL.createObjectURL(blob);
        a.download = suggested;
        a.click();

        URL.revokeObjectURL(a.href);
    }

    let importInputEl: HTMLInputElement | null = null;

    async function importBoardFromFile(file: File) {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as { rows?: TierRow[]; outside?: TierRow['items'] };

            rows = normalizeRows(parsed?.rows);
            outsideItems = normalizeItems(parsed?.outside);
            selectedRowId = null;
        } catch {
            alert('Arquivo inválido.');
        }
    }

    const TRASH_ZONE_ID = 'trash-zone';

    function handleTrashDrop(payload: TierZoneChangePayload) {
        if (payload.zoneId !== TRASH_ZONE_ID) return;

        isTrashOver = false;
        isDragging = false;
    }

    function deleteSelectedRow() {
        if (!selectedRowId) return;

        const idx = rows.findIndex((r) => r.id === selectedRowId);

        if (idx !== -1) {
            rows.splice(idx, 1);
            selectedRowId = null;
        }
    }

    let hasItems = $derived(
        rows.some((r) => (r.items?.length ?? 0) > 0) || (outsideItems?.length ?? 0) > 0
    );
</script>

<main>
    <div id="navbar" class="navbar sticky top-0 z-50 bg-base-200 shadow-sm px-2 h-16 overflow-hidden">
        <div class="flex-1">
            <button class="btn" aria-label="Export" onclick={exportBoard}>
                <Upload /> Export
            </button>

            <button class="btn ml-2" aria-label="Import" onclick={() => importInputEl?.click()}>
                <Download /> Import
            </button>

            <input
                type="file"
                accept="application/json"
                class="hidden"
                bind:this={importInputEl}
                onchange={(e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];

                    if (f) {
                        importBoardFromFile(f);
                    }

                    (e.target as HTMLInputElement).value = '';
                }}
            />
        </div>

        <div class="flex-none flex items-center gap-2">
            <div
                data-role="trash"
                role="region"
                class="relative w-12 h-12 overflow-hidden"
                onpointerenter={() => {
                    if (isDragging) {
                        isTrashOver = true;
                    }
                }}
                onpointerleave={() => {
                    isTrashOver = false;
                }}
                aria-label="Trash - drop to delete"
            >
                <button
                    class="btn btn-square w-12 h-12 relative z-10"
                    class:btn-error={isDragging || isTrashOver || selectedRowId}
                    class:btn-ghost={!(isDragging || isTrashOver || selectedRowId)}
                    onclick={() => {
                        if (selectedRowId) {
                            deleteSelectedRow();
                        }
                    }}
                    title={selectedRowId ? 'Delete selected row' : 'Drop items here to delete'}
                    data-role="trash"
                >
                    <Trash2 class="size-5" />
                </button>

                <div
                    class="absolute inset-0 z-0 h-full w-full opacity-0"
                    class:pointer-events-auto={isDragging}
                    class:pointer-events-none={!isDragging}
                >
                    <TierZone
                        items={[]}
                        zoneId={TRASH_ZONE_ID}
                        onItemsChange={handleTrashDrop}
                    />
                </div>

                <span
                    class="pointer-events-none absolute -inset-2 rounded-xl ring-2 ring-error/60 transition-opacity"
                    class:opacity-0={!isTrashOver}
                ></span>
            </div>

            <button
                class="btn btn-primary"
                onclick={() => globalActionsModal?.open()}
                aria-haspopup="dialog"
                aria-controls="global-actions-dialog"
            >
                <Settings /> Actions
            </button>
        </div>
    </div>

    <section class="container mx-auto max-w-6xl px-4 py-4">
        <div class="rounded-box border border-base-300" id="tierlist" bind:this={boardEl}>
            {#each rows as row, i (row.id)}
                <div
                    class="tier-row grid grid-cols-[101px_1fr_64px] border-b border-base-300"
                    animate:flip={{ duration: 180, easing: quintOut }}
                >
                    <div
                        class="tier-square grid place-items-center px-0
                            min-h-20 border border-transparent transition-all duration-150
                            outline-none
                            focus-visible:ring-2 focus-visible:ring-primary/60
                            focus-within:ring-2 focus-within:ring-primary/60
                            focus-within:ring-offset-2 focus-within:ring-offset-base-100
                            data-[selected=true]:ring-2 data-[selected=true]:ring-primary
                            data-[selected=true]:ring-offset-2 data-[selected=true]:ring-offset-base-100
                            data-[selected=true]:shadow-lg data-[selected=true]:scale-[1.02]"
                        style="background-color:{row.color}; color:#333"
                        role="button"
                        tabindex="-1"
                        aria-pressed={row.id === selectedRowId}
                        data-selected={row.id === selectedRowId ? 'true' : 'false'}
                        data-row-id={row.id}
                        onclick={() => (selectedRowId = row.id)}
                        onfocusin={() => (selectedRowId = row.id)}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                selectedRowId = row.id;
                            }
                        }}
                        aria-label={`Row ${row.label || ''}`}
                    >
                        <span
                            contenteditable="true"
                            role="textbox"
                            aria-multiline="false"
                            aria-label={`Editar rótulo da linha ${i + 1}`}
                            tabindex="0"
                            bind:textContent={rows[i].label}
                            spellcheck="false"
                            class="w-full px-2 text-center outline-none select-text
                                whitespace-pre-wrap wrap-break-word"
                            style="
                                overflow-wrap: anywhere;
                                -webkit-line-break: after-white-space;
                            "
                        ></span>
                    </div>

                    <TierZone
                        items={row.items}
                        zoneId={row.id}
                        onItemsChange={(payload: TierZoneChangePayload) => {
                            const idx = rows.findIndex((r) => r.id === payload.zoneId);

                            if (idx !== -1) {
                                rows[idx].items = payload.items;
                            }
                        }}
                    />

                    <div class="flex items-center justify-between px-1 no-export">
                        <button
                            class="btn btn-ghost btn-square btn-xs h-6 w-6 min-h-0 p-0"
                            onclick={() => openRowSettings(row, i)}
                            aria-label="Row settings"
                            title="Row settings"
                        >
                            <Settings class="size-4" />
                        </button>

                        <div class="flex flex-col items-end gap-1">
                            <button
                                class="btn btn-ghost btn-square btn-xs h-6 w-6 min-h-0 p-0"
                                disabled={i === 0}
                                onclick={() => moveRow(i, -1)}
                                aria-label="Move row up"
                                tabindex="-1"
                                title="Move row up (Ctrl+↑)"
                            >
                                <ChevronUp class="size-4" />
                            </button>

                            <button
                                class="btn btn-ghost btn-square btn-xs h-6 w-6 min-h-0 p-0"
                                disabled={i === rows.length - 1}
                                onclick={() => moveRow(i, 1)}
                                aria-label="Move row down"
                                tabindex="-1"
                                title="Move row down (Ctrl+↓)"
                            >
                                <ChevronDown class="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <div id="outsideArea" class="mt-4 rounded-box border border-dashed border-base-300 bg-base-200/40 p-2">
            <div class="h-28 sm:h-20">
                <TierZone
                    items={outsideItems}
                    zoneId={OUTSIDE_ZONE_ID}
                    onItemsChange={(payload: TierZoneChangePayload) => {
                        if (payload.zoneId === OUTSIDE_ZONE_ID) {
                            outsideItems = payload.items;
                        }
                    }}
                />
            </div>
        </div>
    </section>

    <RowSettingsModal
        bind:this={modalRef}
        onSave={applyRowSettings}
        deleteRow={({ index }) => {
            if (index >= 0 && index < rows.length) {
                selectedRowId = null;
                rows.splice(index, 1);
            }
        }}
        deleteItems={({ index }) => {
            if (rows[index]) {
                rows[index].items = [];
            }
        }}
        addRowAbove={({ index }) => {
            if (rows[index]) {
                const ref = rows[index];
                rows.splice(index, 0, createRow('', ref.color));
            }
        }}
        addRowBelow={({ index }) => {
            if (rows[index]) {
                const ref = rows[index];
                rows.splice(index + 1, 0, createRow('', ref.color));
            }
        }}
        moveItemsOutside={({ index }) => {
            if (rows[index]) {
                outsideItems = [...outsideItems, ...rows[index].items];
                rows[index].items = [];
            }
        }}
        duplicateRow={({ index }) => {
            if (rows[index]) {
                const ref = rows[index];

                const newRow = createRow(ref.label, ref.color);

                newRow.items = ref.items?.map((item) => ({
                    ...item,
                    id: crypto.randomUUID()
                })) ?? [];

                rows.splice(index + 1, 0, newRow);
            }
        }}
    />
</main>

<GlobalActionsModal
    bind:this={globalActionsModal}
    {hasItems}
    onMoveAllItemsToOutside={moveAllItemsToOutside}
    onSaveTierlistImage={saveTierlistImage}
    onDeleteAllItems={deleteAllItems}
    onResetBoard={resetBoard}
/>