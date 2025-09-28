<script lang="ts">
    import { tick } from 'svelte';

    let {
        onOpen = () => {},
        onClose = (_?: { confirmed: boolean }) => {},
        defaultTitle = 'Confirmation',
        defaultConfirm = 'Confirm',
        defaultCancel = 'Cancel',
        defaultDanger = false
    } = $props<{
        onOpen?: () => void;
        onClose?: (e: { confirmed: boolean }) => void;
        defaultTitle?: string;
        defaultConfirm?: string;
        defaultCancel?: string;
        defaultDanger?: boolean;
    }>();

    let dialogEl: HTMLDialogElement;
    let confirmBtn: HTMLButtonElement | null = null;
    let resolver: ((v: boolean) => void) | null = null;

    let title = $state(defaultTitle);
    let message = $state('');
    let confirmLabel = $state(defaultConfirm);
    let cancelLabel = $state(defaultCancel);
    let danger = $state(defaultDanger);

    export async function open(
        msg: string,
        opts?: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean }
    ): Promise<boolean> {
        message = msg;
        title = opts?.title ?? defaultTitle;
        confirmLabel = opts?.confirmText ?? defaultConfirm;
        cancelLabel = opts?.cancelText ?? defaultCancel;
        danger = opts?.danger ?? defaultDanger;

        await tick();
        dialogEl.showModal();
        onOpen?.();

        await tick();
        confirmBtn?.focus();

        return new Promise<boolean>((resolve) => (resolver = resolve));
    }

    function resolveAndClose(val: boolean) {
        if (resolver) {
            const r = resolver;
            resolver = null;
            r(val);
        }
        dialogEl.close();
        onClose?.({ confirmed: val });
    }

    function onConfirm() { resolveAndClose(true); }
    function onCancelClick() { resolveAndClose(false); }

    function onDialogCancel(e: Event) {
        e.preventDefault();
        resolveAndClose(false);
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            onConfirm();
        }
    }

    function onBackdropClick(e: MouseEvent) {
        e.preventDefault();
        onCancelClick();
    }
</script>

<dialog bind:this={dialogEl} class="modal" oncancel={onDialogCancel} onkeydown={onKeydown}>
    <div class="modal-box space-y-4">
        <h3 class="text-lg font-bold">{title}</h3>
        <p class="text-base-content/80">{message}</p>

        <div class="modal-action">
            <button type="button" class="btn" onclick={onCancelClick}>
                {cancelLabel}
            </button>
            <button
                type="button"
                class={`btn ${danger ? 'btn-error' : 'btn-primary'}`}
                bind:this={confirmBtn}
                onclick={onConfirm}
            >
                {confirmLabel}
            </button>
        </div>
    </div>

    <form method="dialog" class="modal-backdrop">
        <button aria-label="Close" onclick={onBackdropClick}>close</button>
    </form>
</dialog>