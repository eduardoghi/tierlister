<script lang="ts">
    import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import { onMount } from 'svelte';
    import type { TierItem } from '$lib/types';
    import StickyNote from '@lucide/svelte/icons/sticky-note';
    
    type WithDndShadow<T> = T & Partial<Record<typeof SHADOW_ITEM_MARKER_PROPERTY_NAME, boolean>>;

    export type TierZoneChangePayload = {
        zoneId: string;
        items: WithDndShadow<TierItem>[];
    };

    type FileToItem = (f: File) => Promise<TierItem>;

    const defaultFileToItem: FileToItem = async (f) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onerror = () => reject(new Error('Error reading file'));
            fr.onload = () => resolve(fr.result as string);
            fr.readAsDataURL(f);
        });
        return { id: crypto.randomUUID(), url: dataUrl, note: '' };
    };

    type Props = {
        items?: WithDndShadow<TierItem>[];
        zoneId?: string;
        minHeightClass?: string;
        onItemsChange?: (payload: { zoneId: string; items: WithDndShadow<TierItem>[] }) => void;
        onOpenSettings?: (payload: { zoneId: string }) => void;
        fileToItem?: FileToItem;
    };

    let {
        items = [] as WithDndShadow<TierItem>[],
        zoneId = '',
        minHeightClass = 'min-h-20',
        onItemsChange = (_: { zoneId: string; items: WithDndShadow<TierItem>[] }) => {},
        onOpenSettings = (_: { zoneId: string }) => {},
        fileToItem = defaultFileToItem
    }: Props = $props();

    const flipDurationMs = 150;

    function forward(ev: CustomEvent<any>) {
        const next = ev.detail?.items as WithDndShadow<TierItem>[] | undefined;
        if (next) onItemsChange({ zoneId, items: next });
    }

    async function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return;
        const created = await Promise.all(files.map((f) => fileToItem(f)));
        onItemsChange({ zoneId, items: [...items, ...created] });
    }

    let ctrlDown = $state(false);

    type PopoverState = {
        open: boolean;
        editing: boolean;
        itemId: string | null;
        anchorEl: HTMLElement | null;
        x: number;
        y: number;
    };

    let pop = $state<PopoverState>({
        open: false,
        editing: false,
        itemId: null,
        anchorEl: null,
        x: 0,
        y: 0
    });

    let draftNote = $state('');

    function clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n));
    }

    function computePopoverPos(anchor: HTMLElement) {
        const r = anchor.getBoundingClientRect();
        const pad = 8;

        const desiredX = r.right + pad;
        const desiredY = r.top;

        const popWidth = 260;
        const popHeight = pop.editing ? 170 : 110;

        const x = clamp(desiredX, pad, window.innerWidth - popWidth - pad);
        const y = clamp(desiredY, pad, window.innerHeight - popHeight - pad);

        pop.x = x;
        pop.y = y;
    }

    function openPopoverFor(item: WithDndShadow<TierItem>, el: HTMLElement, editing: boolean) {
        pop.open = true;
        pop.editing = editing;
        pop.itemId = item.id;
        pop.anchorEl = el;

        draftNote = item.note ?? '';

        computePopoverPos(el);

        if (editing) {
            requestAnimationFrame(() => {
                const ta = document.querySelector<HTMLTextAreaElement>('[data-note-textarea="true"]');
                ta?.focus();
                ta?.select();
            });
        }
    }

    function closePopover() {
        pop.open = false;
        pop.editing = false;
        pop.itemId = null;
        pop.anchorEl = null;
    }

    function saveNote() {
        if (!pop.itemId) return;

        const next = items.map((it) => {
            if (it.id !== pop.itemId) return it;
            return { ...it, note: draftNote };
        });

        onItemsChange({ zoneId, items: next });
        closePopover();
    }

    function currentItemNote(): string {
        if (!pop.itemId) return '';
        const it = items.find((x) => x.id === pop.itemId);
        return it?.note ?? '';
    }

    let hovered = $state<{ id: string | null; el: HTMLElement | null }>({ id: null, el: null });

    onMount(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                ctrlDown = true;

                if (!pop.editing && hovered.id && hovered.el) {
                    const it = items.find((x) => x.id === hovered.id);
                    if (it && !it[SHADOW_ITEM_MARKER_PROPERTY_NAME]) {
                        openPopoverFor(it, hovered.el, false);
                    }
                }
            }

            if (e.key === 'Escape' && pop.open) {
                closePopover();
                e.preventDefault();
                e.stopPropagation();
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') {
                ctrlDown = false;
                if (pop.open && !pop.editing) closePopover();
            }
        };

        const onScrollOrResize = () => {
            if (!pop.open || !pop.anchorEl) return;
            computePopoverPos(pop.anchorEl);
        };

        window.addEventListener('keydown', onKeyDown, { capture: true });
        window.addEventListener('keyup', onKeyUp, { capture: true });
        window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true });
        window.addEventListener('resize', onScrollOrResize);

        return () => {
            window.removeEventListener('keydown', onKeyDown, { capture: true });
            window.removeEventListener('keyup', onKeyUp, { capture: true });
            window.removeEventListener('scroll', onScrollOrResize, { capture: true });
            window.removeEventListener('resize', onScrollOrResize);
        };
    });
</script>

<section
    class="bg-base-300/60 h-full w-full {minHeightClass}"
    aria-label="tier-zone"
    ondrop={handleFileDrop}
    ondragover={(e) => e.preventDefault()}
>
    <div
        use:dndzone={{ items, flipDurationMs: flipDurationMs, dropTargetStyle: { outline: 'none' }}}
        data-zone={zoneId}
        class="h-full flex flex-wrap content-start"
        onconsider={forward}
        onfinalize={forward}
    >
        {#each items as item (item.id + (item[SHADOW_ITEM_MARKER_PROPERTY_NAME] ? '_shadow' : ''))}
            <div
                class="relative size-20 cursor-grab overflow-hidden rounded-md"
                animate:flip={{ duration: flipDurationMs }}
                data-is-dnd-shadow-item-hint={item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
                onpointerenter={(e) => {
                    if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) return;

                    hovered.id = item.id;
                    hovered.el = e.currentTarget as HTMLElement;

                    if (!ctrlDown) return;
                    if (pop.editing) return;

                    openPopoverFor(item, hovered.el, false);
                }}
                onpointerleave={() => {
                    if (hovered.id === item.id) {
                        hovered.id = null;
                        hovered.el = null;
                    }

                    if (pop.open && !pop.editing && pop.itemId === item.id) closePopover();
                }}
                onpointermove={(e) => {
                    if (!pop.open || pop.editing) return;
                    if (pop.itemId !== item.id) return;
                    computePopoverPos(e.currentTarget as HTMLElement);
                }}
                onpointerdown={(e) => {
                    if (!e.ctrlKey) return;
                    if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) return;

                    e.preventDefault();
                    e.stopPropagation();

                    openPopoverFor(item, e.currentTarget as HTMLElement, true);
                }}
            >
                <img
                    src={item.url}
                    alt=""
                    class="w-full h-full object-cover select-none pointer-events-none"
                    draggable="false"
                />

                {#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
                    <div class="absolute inset-0 grid place-items-center dnd-shadow">
                        <img
                            src={item.url}
                            alt=""
                            class="w-full h-full object-cover select-none pointer-events-none opacity-30"
                            draggable="false"
                        />
                    </div>
                {/if}

                {#if (item.note?.trim()?.length ?? 0) > 0 && !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
                    <div class="absolute bottom-1 right-1 badge badge-sm badge-neutral opacity-80 p-0">
                        <StickyNote class="size-3" />
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</section>

{#if pop.editing}
  <div
    class="fixed inset-0 z-[9998] bg-black/40"
    aria-hidden="true"
    onpointerdown={(e) => {
      // do nothing - just block interactions behind
      e.stopPropagation();
    }}
  ></div>
{/if}
{#if pop.open}
    <div
        class="fixed z-[9999] w-[260px] rounded-box border border-base-300 bg-base-100 shadow-lg p-2 text-sm"
        style="left:{pop.x}px; top:{pop.y}px;"
        onpointerdowncapture={(e) => e.stopPropagation()}
    >
        <div class="flex items-start justify-between gap-2">
            <div class="font-semibold">Notes</div>
            <button class="btn btn-ghost btn-xs" onclick={closePopover} aria-label="Close">✕</button>
        </div>

        {#if pop.editing}
            <textarea
                data-note-textarea="true"
                class="textarea textarea-bordered w-full mt-2 text-sm"
                rows="4"
                bind:value={draftNote}
                placeholder="Type a note…"
            ></textarea>

            <div class="mt-2 flex justify-end gap-2">
                <button class="btn btn-ghost btn-sm" onclick={closePopover}>Cancel</button>
                <button class="btn btn-primary btn-sm" onclick={saveNote}>Save</button>
            </div>
        {:else}
            <div class="mt-2 whitespace-pre-wrap break-words">
                {#if (currentItemNote()?.trim()?.length ?? 0) > 0}
                    {currentItemNote()}
                {:else}
                    <span class="opacity-60 italic">No notes.</span>
                {/if}
            </div>

            <div class="mt-2 opacity-60 text-xs">
                Ctrl + click to edit
            </div>
        {/if}
    </div>
{/if}

<style>
    :global(.dnd-shadow) {
        visibility: visible;
    }
</style>
