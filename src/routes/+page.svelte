<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { Colord } from 'colord';
	import { flip } from 'svelte/animate';
	import { dialog, fs } from '@tauri-apps/api';

	import { Button, Modal, ModalBody } from 'yesvelte';
	import HorizontalList from '../components/HorizontalList.svelte';
	import {
		IconUpload,
		IconDownload,
		IconSettings,
		IconTrash,
		IconFoldDown,
		IconReload
	} from '@tabler/icons-svelte';
	import ColorPicker, { ChromeVariant } from 'svelte-awesome-color-picker';

	type TierRow = {
		id: string;
		tier: string;
		backgroundColor: string;
		items: Item[];
	};

	type Circle = {
		id: string;
		backgroundColor: string;
	};

	const DEFAULT_TIER_ROWS: TierRow[] = [
		{ tier: 'S', backgroundColor: '#ff7e7e', items: [] },
		{ tier: 'A', backgroundColor: '#ffbf7f', items: [] },
		{ tier: 'B', backgroundColor: '#fdff7e', items: [] },
		{ tier: 'C', backgroundColor: '#7eff80', items: [] },

		{ tier: 'D', backgroundColor: '#7dfffe', items: [] },
		{ tier: 'E', backgroundColor: '#807efe', items: [] },
		{ tier: 'F', backgroundColor: '#ff7ffe', items: [] }
	].map((row) => ({ ...row, id: uuidv4() }));

	const CIRCLE_COLORS: string[] = [
		'#FF7F7F',
		'#FFBF7F',
		'#FFDF7F',
		'#FFFF7F',
		'#BFFF7F',
		'#7FFF7F',
		'#7FFFFF',
		'#7FBFFF',
		'#7F7FFF',
		'#FF7FFF',
		'#BF7FBF',
		'#3B3B3B',
		'#858585',
		'#CFCFCF',
		'#F7F7F7'
	];

	const circles: Circle[] = CIRCLE_COLORS.map((color) => ({
		id: uuidv4(),
		backgroundColor: color
	}));

	let showRowSettings: boolean = false;
	let showGeneralsettings: boolean = false;
	let editingRow: string | null = null;
	let outsideAreaItems: any[] = [];
	let hex: any;
	let rgb: any;
	let hsv: any;
	let color: any;
	let tierRows: TierRow[] = [...DEFAULT_TIER_ROWS];
	let selectedCircleId: string | null = null;

	function moveRow(index: number, direction: 'up' | 'down'): void {
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (targetIndex >= 0 && targetIndex < tierRows.length) {
			[tierRows[index], tierRows[targetIndex]] = [tierRows[targetIndex], tierRows[index]];
		}
	}

	function openColorPickerWithColor(backgroundColor: string, rowId: string): void {
		const colorObj = new Colord(backgroundColor);
		hex = colorObj.toHex();
		rgb = colorObj.toRgb();
		hsv = colorObj.toHsv();

		editingRow = rowId;
		showRowSettings = true;
	}

	function updateTierRowColor(event: any): void {
		if (editingRow !== null) {
			selectedCircleId = null;

			const rowIndex = tierRows.findIndex((row) => row.id === editingRow);
			if (rowIndex !== -1) {
				tierRows[rowIndex].backgroundColor = event.detail.hex;
			}
		}
	}

	function resetAllSettings(): void {
		tierRows = DEFAULT_TIER_ROWS.map((row) => ({ ...row, id: uuidv4(), items: [] }));
		outsideAreaItems = [];
		editingRow = null;
		showGeneralsettings = false;
		selectedCircleId = null;
	}

	function selectCircle(id: string, backgroundColor: string): void {
		selectedCircleId = id;
		if (editingRow !== null) {
			const rowIndex = tierRows.findIndex((row) => row.id === editingRow);
			if (rowIndex !== -1) {
				tierRows[rowIndex].backgroundColor = backgroundColor;
			}
		}
	}

	async function exportToJsonFile(): Promise<void> {
		try {
			const filePath = await dialog.save({
				filters: [{ name: 'JSON', extensions: ['json'] }]
			});
			if (!filePath) return;

			const dataToExport = { tierRows, outsideArea: outsideAreaItems };
			const dataStr = JSON.stringify(dataToExport, null, 4);

			await fs.writeFile({ path: filePath, contents: dataStr });
			alert('Arquivo exportado com sucesso!');
		} catch (error) {
			console.error('Erro ao exportar arquivo:', error);
			alert('Erro ao exportar o arquivo.');
		}
	}

	async function importFromJsonFile(): Promise<void> {
		try {
			const result = await dialog.open({
				multiple: false,
				directory: false,
				filters: [{ name: 'JSON', extensions: ['json'] }]
			});

			if (typeof result === 'string') {
				const fileContent = await fs.readTextFile(result);
				const importedData = JSON.parse(fileContent);

				tierRows = importedData.tierRows;
				outsideAreaItems = importedData.outsideArea;

				alert('Arquivo importado com sucesso!');
			}
		} catch (error) {
			console.error('Erro ao importar arquivo:', error);
			alert('Erro ao importar o arquivo.');
		}
	}

	function updateItemsInTierRow(index: number, updatedItems: Item[]): void {
		tierRows[index].items = updatedItems;
	}

	function updateTierLabel(rowId: string, newTier: string): void {
		const rowIndex = tierRows.findIndex((row) => row.id === rowId);
		if (rowIndex !== -1) {
			tierRows[rowIndex].tier = newTier;
		}
	}

	function handleBlur(event: any, rowId: string): void {
		let newText = event.target.innerText;

		if (!newText.trim()) {
			newText = '\u00A0';
			event.target.innerHTML = newText;
		}

		updateTierLabel(rowId, newText.replace('\u00A0', ''));
	}

	function updateOutsideAreaItems(items: any): void {
		outsideAreaItems = items;
	}

	function moveToOutsideArea(): void {
		const allItems = tierRows.flatMap((row) => row.items);

		outsideAreaItems = [...outsideAreaItems, ...allItems];

		tierRows = tierRows.map((row) => ({ ...row, items: [] }));
	}

	function deleteRow(): void {
		if (editingRow !== null) {
			tierRows = tierRows.filter((row) => row.id !== editingRow);
			closeRowSettings();
		}
	}

	function addRow(position: 'above' | 'below'): void {
		if (editingRow !== null) {
			const index = tierRows.findIndex((row) => row.id === editingRow);
			if (index > -1) {
				const newRow = { tier: ' ', backgroundColor: '#ffffff', items: [], id: uuidv4() };
				const newIndex = position === 'above' ? index : index + 1;

                let newTierRows = [...tierRows];
                newTierRows.splice(newIndex, 0, newRow);

                tierRows = newTierRows;

				closeRowSettings();
			}
		}
	}

	function deleteItemsFromRow(): void {
		if (editingRow !== null) {
			const rowIndex = tierRows.findIndex((row) => row.id === editingRow);
			if (rowIndex !== -1) {
				tierRows[rowIndex].items = [];
				closeRowSettings();
			}
		}
	}

	function moveToSelectedOutsideArea(rowId: string | null): void {
		const rowIndex = tierRows.findIndex((row) => row.id === rowId);
		if (rowIndex !== -1) {
			outsideAreaItems = [...outsideAreaItems, ...tierRows[rowIndex].items];
			tierRows[rowIndex].items = [];
		}
	}

	function clearAllItems(): void {
		tierRows = tierRows.map((row) => ({ ...row, items: [] }));
		outsideAreaItems = [];
	}

	function closeRowSettings(): void {
		editingRow = null;
		showRowSettings = false;
	}
</script>

{#if showRowSettings || showGeneralsettings}
	<div class="modal-backdrop"></div>
{/if}

<Modal bind:show={showGeneralsettings} dismissible backdrop={false} style="overflow-x: hidden">
	<ModalBody
		style="height: 300px; display: flex; flex-direction: column; justify-content: space-between;"
	>
		<div style="padding: 20px; display: flex; flex-direction: column; gap: 20px; margin-top: 20px;">
			<Button on:click={moveToOutsideArea} style="general-settings-button">
				<IconFoldDown size={24} />Move All to Outside Area
			</Button>

			<div style="display: flex; flex-direction: column; gap: 20px;">
				<Button color="red" on:click={clearAllItems} style="general-settings-button">
					<IconTrash size={24} />Delete items
				</Button>
				<Button on:click={resetAllSettings} style="general-settings-button">
					<IconReload size={24} />Reset
				</Button>
			</div>
		</div>
	</ModalBody>
</Modal>

<Modal bind:show={showRowSettings} dismissible backdrop={false} style="overflow-x: hidden">
	<ModalBody style="height: 500px;">
		<div class="flex">
			<ColorPicker
				bind:rgb
				bind:hsv
				bind:hex
				bind:color
				on:input={updateTierRowColor}
				components={ChromeVariant}
				sliderDirection="horizontal"
				isDialog={false}
			/>
			<div class="circle-container">
				{#each circles as circle}
					<div
						class="circle"
						style="background-color: {circle.backgroundColor};"
						class:selected={selectedCircleId === circle.id}
						on:click={() => selectCircle(circle.id, circle.backgroundColor)}
					></div>
				{/each}
			</div>
		</div>
		<div class="flex" style="margin-top: 10px;">
			<div class="flex" style="flex-direction: column;">
				<Button color="red" on:click={deleteRow}>
					<IconTrash size={24} />Delete row
				</Button>
				<Button style="margin-top: 25px;" color="red" on:click={deleteItemsFromRow}>
					<IconTrash size={24} />Delete items
				</Button>
			</div>
			<div class="flex" style="margin-left: 20px; flex-direction: column;">
				<div class="flex">
					<Button on:click={() => addRow('above')}>Add Row Above</Button>
					<Button on:click={() => addRow('below')} style="margin-left: 10px;">Add Row Below</Button>
				</div>
				<Button on:click={() => moveToSelectedOutsideArea(editingRow)} style="margin-top: 20px;">
					Move to Outside Area
				</Button>
			</div>
		</div>
	</ModalBody>
</Modal>

<div style="padding: 20px;">
	<div class="buttons-container">
		<Button on:click={exportToJsonFile}>
			<IconUpload size={24} />Export
		</Button>
		<Button on:click={importFromJsonFile}>
			<IconDownload size={24} />Import
		</Button>
		<Button on:click={() => (showGeneralsettings = true)}>
			<IconSettings size={32} />
		</Button>
	</div>
	<div class="tierlist" style="margin-bottom: 10px; margin-top: 20px;">
		{#each tierRows as row, index (row.id)}
			<div class="tier-row" animate:flip={{ duration: 200 }}>
				<div class="tier-square" style="background-color: {row.backgroundColor};">
					<span
						contenteditable="true"
						style="color: #333; overflow: hidden; text-align: center; margin: 5px;"
						on:blur={(event) => handleBlur(event, row.id)}>{row.tier}</span
					>
				</div>
				<HorizontalList
					items={row.items}
					on:updateItems={(event) => updateItemsInTierRow(index, event.detail.items)}
				/>
				<div class="icon-container">
					<div class="row-settings">
						<svg
							on:click={() => openColorPickerWithColor(row.backgroundColor, row.id)}
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-settings"
							width="38"
							height="38"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"
							/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg
						>
					</div>
					<div class="arrow-icons">
						<svg
							on:click={() => moveRow(index, 'up')}
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-arrow-up"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M12 5v14" />
							<path d="M18 11l-6-6" />
							<path d="M6 11l6-6" />
						</svg>
						<svg
							on:click={() => moveRow(index, 'down')}
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-arrow-down"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M12 5v14" />
							<path d="M18 13l-6 6" />
							<path d="M6 13l6 6" />
						</svg>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div id="outside_area" style="border: 1px solid black; width: 960px;">
		<HorizontalList
			containerWidth="960px"
			bind:items={outsideAreaItems}
			on:updateItems={(event) => updateOutsideAreaItems(event.detail.items)}
		/>
	</div>
</div>

<style>
	.tierlist {
		background-color: #1a1a17;
		display: flex;
		flex-direction: column;
		border-left: 1px solid black;
		border-right: 1px solid black;
		overflow-x: hidden;
		max-width: 996px;
	}

	.tier-row {
		display: flex;
		flex-direction: row;
		min-height: 80px;
		border-top: 1px solid black;
		border-bottom: 1px solid black;
	}

	.tier-square {
		width: 100px;
		min-height: 80px;
		border-right: 1px solid black;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-container {
		min-width: 80px;
		background: black;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.row-settings {
		width: 40px;
		height: 40px;
		display: inline-block;
	}

	.arrow-icons {
		width: 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.icon-container .icon:hover {
		color: #4d90fe;
		transform: scale(0.95);
		cursor: pointer;
	}

	.buttons-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 50;
	}

	.circle-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-around;
		margin-top: 20px;
		width: 150px;
	}

	.circle {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid transparent;
		margin: 5px;
	}

	.circle.selected {
		border-color: black;
	}

	.general-settings-button {
		width: 80%;
		max-width: 300px;
		margin: auto;
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
