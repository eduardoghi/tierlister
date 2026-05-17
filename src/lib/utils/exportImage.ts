import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import * as htmlToImage from 'html-to-image';

function dataUrlToBytes(dataUrl: string): Uint8Array {
    const b64 = dataUrl.split(',')[1];
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);

    for (let i = 0; i < bin.length; i++) {
        out[i] = bin.charCodeAt(i);
    }

    return out;
}

export async function saveTierlistElementAsPng(el: HTMLElement | null) {
    if (!el) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const rowEls = Array.from(el.querySelectorAll<HTMLElement>('.tier-row'));
    const prevCols = rowEls.map((row) => row.style.gridTemplateColumns);

    rowEls.forEach((row) => {
        row.style.gridTemplateColumns = '90px 1fr';
    });

    const noExportEls = Array.from(el.querySelectorAll<HTMLElement>('.no-export'));
    const prevDisplay = noExportEls.map((node) => node.style.display);

    noExportEls.forEach((node) => {
        node.style.display = 'none';
    });

    const prevCaret = el.style.caretColor;
    const prevAnimation = el.style.animation;
    const prevTransition = el.style.transition;

    el.style.caretColor = 'transparent';
    el.style.animation = 'none';
    el.style.transition = 'none';

    const filter = (node: HTMLElement) => {
        return !(node.closest && node.closest('.no-export'));
    };

    await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
        )
    );

    try {
        const pngUrl = await htmlToImage.toPng(el, {
            pixelRatio: dpr,
            cacheBust: true,
            width: el.scrollWidth,
            height: el.scrollHeight,
            filter
        });

        const suggested = `tierlist-${new Date().toISOString().slice(0, 10)}.png`;

        try {
            const filePath = await save({
                defaultPath: suggested,
                filters: [{ name: 'PNG', extensions: ['png'] }]
            });

            if (filePath) {
                const finalPath = filePath.endsWith('.png') ? filePath : `${filePath}.png`;
                await writeFile(finalPath, dataUrlToBytes(pngUrl));
                return;
            }
        } catch (err) {
            console.error('Tauri save failed:', err);
        }

        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = suggested;
        a.click();
    } finally {
        rowEls.forEach((row, index) => {
            row.style.gridTemplateColumns = prevCols[index] ?? '';
        });

        noExportEls.forEach((node, index) => {
            node.style.display = prevDisplay[index] ?? '';
        });

        el.style.caretColor = prevCaret;
        el.style.animation = prevAnimation;
        el.style.transition = prevTransition;
    }
}