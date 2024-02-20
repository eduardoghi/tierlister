<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { v4 as uuidv4 } from 'uuid';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let items: Item[] = [];
	export let containerWidth = '814px';

	const flipDurationMs = 200;
    
	type DndEventDetail = { items: Item[] };
	type DndEvent = CustomEvent<DndEventDetail>;

	function handleDnd(e: DndEvent): void {
		updateItems(e.detail.items);
	}

	function updateItems(newItems: Item[]): void {
		items = newItems;
		dispatch('updateItems', { items });
	}

	async function handleFileDrop(event: DragEvent): Promise<void> {
		event.preventDefault();
		if (!event.dataTransfer) return;

		const files: File[] = Array.from(event.dataTransfer.files);
		const imageItems: Promise<Item>[] = files
			.filter((file) => file.type.startsWith('image/'))
			.map((file) => createItemFromFile(file));
		const newItems = await Promise.all(imageItems);
		updateItems([...items, ...newItems]);
	}

	async function createItemFromFile(file: File): Promise<Item> {
		const dataUrl: string = await readFile(file);
		return { id: uuidv4(), name: file.name, imageUrl: dataUrl };
	}

	function readFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}
</script>

<section
	style="width: {containerWidth};"
	use:dndzone={{ items, flipDurationMs }}
	on:consider={handleDnd}
	on:finalize={handleDnd}
	on:dragover|preventDefault
	on:dragenter|preventDefault
	on:drop={handleFileDrop}
>
	{#each items as item (item.id)}
		<div
			style="background-image: url({item.imageUrl});"
			animate:flip={{ duration: flipDurationMs }}
		>
			{#if !item.imageUrl}
				{item.name}
			{/if}
		</div>
	{/each}
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		min-height: 80px;
	}

	div {
		display: inline-block;
		width: 80px;
		height: 80px;
		background-position: center;
		background-size: cover;
	}
</style>
