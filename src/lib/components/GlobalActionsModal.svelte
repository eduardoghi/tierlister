<script lang="ts">
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import MoveDown from '@lucide/svelte/icons/move-down';
    import FileImage from '@lucide/svelte/icons/file-image';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';

    type ConfirmModalInstance = ReturnType<typeof ConfirmModal>;

    let {
        hasItems = false,
        onMoveAllItemsToOutside = () => {},
        onSaveTierlistImage = async () => {},
        onDeleteAllItems = () => {},
        onResetBoard = () => {}
    } = $props<{
        hasItems?: boolean;
        onMoveAllItemsToOutside?: () => void;
        onSaveTierlistImage?: () => Promise<void>;
        onDeleteAllItems?: () => void;
        onResetBoard?: () => void;
    }>();

    let dialogEl: HTMLDialogElement;
    let confirmModal: ConfirmModalInstance;

    export function open() {
        dialogEl.showModal();
    }

    function close() {
        dialogEl.close();
    }

    async function handleMoveAllItemsToOutside() {
        const ok = await confirmModal.open(
            'Move ALL items to the outside area?',
            { title: 'Move items', confirmText: 'Move' }
        );

        if (!ok) return;

        onMoveAllItemsToOutside();
        close();
    }

    async function handleExportAsPng() {
        await onSaveTierlistImage();
        close();
    }

    async function handleDeleteAllItems() {
        const ok = await confirmModal.open(
            'Remove ALL items (rows and outside area)?',
            { title: 'Remove items', confirmText: 'Remove', danger: true }
        );

        if (!ok) return;

        onDeleteAllItems();
        close();
    }

    async function handleResetBoard() {
        const ok = await confirmModal.open(
            'Restore the default rows and move all row items to the outside area?',
            { title: 'Reset rows', confirmText: 'Reset' }
        );

        if (!ok) return;

        onResetBoard();
        close();
    }
</script>

<dialog id="global-actions-dialog" class="modal" bind:this={dialogEl}>
    <div class="modal-box">
        <h3 class="font-bold text-lg">Global actions</h3>

        <p class="text-sm opacity-70 mt-1">
            These actions affect all rows/items in the tier list.
        </p>

        <div class="mt-4 space-y-2">
            <button
                class="btn focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full"
                onclick={handleMoveAllItemsToOutside}
                title="Move every item from all rows to the outside area"
            >
                <MoveDown class="size-4 mr-2" />
                Move items to outside area
            </button>

            <button
                class="btn w-full"
                onclick={handleExportAsPng}
                title="Save tier list as PNG"
                aria-label="Save tier list as PNG"
            >
                <FileImage class="size-4 mr-2" />
                Export as PNG
            </button>

            <div class="divider my-3"></div>

            <button
                class="btn btn-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full"
                onclick={handleDeleteAllItems}
                disabled={!hasItems}
                aria-disabled={!hasItems}
                aria-label="Delete all items"
                title={hasItems ? 'Remove all items from the board' : 'No items to delete'}
            >
                <Trash2 class="size-4 mr-2" />
                Delete items
            </button>

            <button
                class="btn btn-secondary w-full"
                onclick={handleResetBoard}
                title="Restore default rows and move row items to the outside area"
            >
                Reset rows
            </button>
        </div>

        <div class="modal-action">
            <form method="dialog">
                <button class="btn" aria-label="Close">Close</button>
            </form>
        </div>
    </div>

    <form method="dialog" class="modal-backdrop">
        <button aria-label="Close">close</button>
    </form>
</dialog>

<ConfirmModal bind:this={confirmModal} />