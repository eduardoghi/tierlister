<script lang="ts">
    import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import type { TierItem } from '$lib/types';

    type WithDndShadow<T> = T & Partial<Record<typeof SHADOW_ITEM_MARKER_PROPERTY_NAME, boolean>>;

    export type TierZoneChangePayload = {
        zoneId: string;
        items: WithDndShadow<TierItem>[];
    };

    type FileToItem = (f: File) => Promise<TierItem>;

    const defaultFileToItem: FileToItem = async (f) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onerror = () => reject(new Error('Erro lendo arquivo'));
            fr.onload = () => resolve(fr.result as string);
            fr.readAsDataURL(f);
        });
        return { id: crypto.randomUUID(), url: dataUrl };
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
            </div>
        {/each}
    </div>
</section>

<style>
    :global(.dnd-shadow) {
        visibility: visible;
    }
</style>
