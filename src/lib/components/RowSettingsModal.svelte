<script lang="ts">
    import type { TierRow } from '$lib/types';
    import { tick } from 'svelte';
    import Check from '@lucide/svelte/icons/check';
    import Plus from '@lucide/svelte/icons/plus';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import MoveDown from '@lucide/svelte/icons/move-down';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    type ConfirmModalInstance = ReturnType<typeof ConfirmModal>;

    let {
        onSave = (patch: Partial<TierRow>) => {},
        deleteRow,
        deleteItems,
        addRowAbove,
        addRowBelow,
        moveItemsOutside
    } = $props<{
        onSave?: (patch: Partial<TierRow>) => void;
        deleteRow?: (p: { index: number; rowId: string }) => void;
        deleteItems?: (p: { index: number; rowId: string }) => void;
        addRowAbove?: (p: { index: number; rowId: string }) => void;
        addRowBelow?: (p: { index: number; rowId: string }) => void;
        moveItemsOutside?: (p: { index: number; rowId: string }) => void;
    }>();

    const CIRCLE_COLORS: string[] = [
        '#FF7F7F','#FFBF7F','#FFDF7F','#FFFF7F',
        '#BFFF7F','#7FFF7F','#7FFFFF','#7FBFFF',
        '#7F7FFF','#FF7FFF','#BF7FBF','#3B3B3B',
        '#858585','#CFCFCF','#F7F7F7'
    ];

    let dialogEl: HTMLDialogElement;
    let confirmModal: ConfirmModalInstance;

    let draftColor = $state('#ffffff');
    let currentRow = $state<TierRow | null>(null);
    let currentIndex = $state(-1);

    const hasItems = $derived((currentRow?.items?.length ?? 0) > 0);

    export async function open(row: TierRow, index: number) {
        currentRow = row;
        currentIndex = index;
        draftColor = row.color ?? '#ffffff';
        await tick();
        dialogEl.showModal();
    }

    function close() {
        dialogEl.close();
        currentRow = null;
        currentIndex = -1;
    }

    function onSubmit(e: Event) {
        e.preventDefault();
        onSave({ color: draftColor });
        close();
    }

    function pickColor(c: string) {
        draftColor = c;
    }

    function checkColor(hex: string): string {
        const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!m) return '#000';
        const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? '#000' : '#fff';
    }

    function guardRow() {
        if (!currentRow || currentIndex < 0) return null;
        return { rowId: currentRow.id, index: currentIndex };
    }

    async function handleDeleteRow() {
        const g = guardRow(); if (!g) return;
        const ok = await confirmModal.open(
            'Remove this row and discard all its items?',
            { title: 'Remove row', confirmText: 'Remove', danger: true }
        );
        if (!ok) return;
        deleteRow?.(g);
        close();
    }

    async function handleDeleteItems() {
        const g = guardRow(); if (!g) return;
        const ok = await confirmModal.open(
            'Remove ALL items from this row?',
            { title: 'Remove items', confirmText: 'Remove', danger: true }
        );
        if (!ok) return;
        deleteItems?.(g);
        close();
    }

    function handleAddRowAbove() {
        const g = guardRow(); if (!g) return;
        addRowAbove?.(g);
        close();
    }

    function handleAddRowBelow() {
        const g = guardRow(); if (!g) return;
        addRowBelow?.(g);
        close();
    }

    function handleMoveItemsOutside() {
        const g = guardRow(); if (!g) return;
        moveItemsOutside?.(g);
        close();
    }
</script>

<dialog bind:this={dialogEl} class="modal">
    <div class="modal-box space-y-4">
        <h3 class="text-lg font-bold">Row settings</h3>

        <form class="space-y-4" onsubmit={onSubmit}>
            <div class="form-control">
                <label id="color-label" class="label" for="row-color">
                    <span class="label-text">Color</span>
                </label>

                <div class="flex flex-wrap items-center gap-3">
                    <input
                        id="row-color"
                        type="color"
                        class="input input-bordered w-24 h-10 p-1"
                        bind:value={draftColor}
                        aria-label="Color picker"
                        aria-labelledby="color-label"
                        required
                    />

                    <div class="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="color-label">
                        {#each CIRCLE_COLORS as c}
                            <button
                                type="button"
                                class="relative h-8 w-8 rounded-full border border-base-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                style={"background-color:" + c}
                                role="radio"
                                aria-checked={draftColor === c}
                                title={c}
                                onclick={() => pickColor(c)}
                                onkeydown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        pickColor(c);
                                    }
                                }}
                            >
                                {#if draftColor === c}
                                    <span class="absolute inset-0 grid place-items-center">
                                        <Check class="size-4" style={"color:" + checkColor(c)} />
                                    </span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="divider my-2">Actions</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                    type="button"
                    class="btn btn-outline justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={handleAddRowAbove}
                    aria-label="Add row above"
                    title="Insert a new row above"
                >
                    <Plus class="size-4 mr-2" />
                    Add row above
                </button>

                <button
                    type="button"
                    class="btn btn-outline justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={handleAddRowBelow}
                    aria-label="Add row below"
                    title="Insert a new row below"
                >
                    <Plus class="size-4 mr-2" />
                    Add row below
                </button>

                <button
                    type="button"
                    class="btn btn-warning justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={handleDeleteItems}
                    disabled={!hasItems}
                    aria-disabled={!hasItems}
                    aria-label="Delete all items in this row"
                    title={hasItems ? 'Remove all items from this row' : 'No items to delete'}
                >
                    <Trash2 class="size-4 mr-2" />
                    Delete items
                </button>

                <button
                    type="button"
                    class="btn btn-error justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={handleDeleteRow}
                    aria-label="Delete this row"
                    title="Remove this row (and its items)"
                >
                    <Trash2 class="size-4 mr-2" />
                    Delete row
                </button>

                <button
                    type="button"
                    class="btn btn-outline col-span-1 sm:col-span-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={handleMoveItemsOutside}
                    disabled={!hasItems}
                    aria-disabled={!hasItems}
                    aria-label="Move items to outside area"
                    title={hasItems ? 'Move all items to outside area' : 'No items to move'}
                >
                    <MoveDown class="size-4 mr-2" />
                    Move items to outside area
                </button>
            </div>

            <div class="modal-action">
                <button
                    type="button"
                    class="btn btn-ghost focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onclick={close}
                    aria-label="Cancel"
                    title="Close without saving"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn btn-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Save row settings"
                    title="Save changes"
                >
                    Save
                </button>
            </div>
        </form>
    </div>

    <form method="dialog" class="modal-backdrop">
        <button aria-label="Close">close</button>
    </form>
</dialog>

<ConfirmModal bind:this={confirmModal} />
