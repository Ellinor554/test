// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/NumberLineView.js
// View half of the Tallinjer tool. SVG line + draggable marker.
// ═══════════════════════════════════════════════════════════════════════════

import { NumberLineEngine, NUMBER_LINE_PRESETS, formatValue } from './NumberLineEngine.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 960, H = 130, LINE_Y = 65, PAD = 55;
const MARKER_SIZE_PX = 44;
const ARROW_HEIGHT_PX = 38;

const PRESET_BUTTONS = [
    { label: '0 till 10',          range: NUMBER_LINE_PRESETS.zeroToTen,      classes: 'bg-soft-blueLight/30 text-soft-blue hover:bg-soft-blueLight/50' },
    { label: '0 till 100',         range: NUMBER_LINE_PRESETS.zeroToHundred,  classes: 'bg-soft-blueLight/30 text-soft-blue hover:bg-soft-blueLight/50' },
    { label: '0 till 3 (Decimaler)', range: NUMBER_LINE_PRESETS.zeroToThreeDec, classes: 'bg-soft-blueLight/30 text-soft-blue hover:bg-soft-blueLight/50' },
];

export class NumberLineView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};

    constructor(engine = new NumberLineEngine()) {
        this.#engine = engine;
    }

    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-numberlines';
        this.#root.className = 'flex-col h-full bg-soft-surface';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#wireEvents();

        let lastRange = null;
        this.#unsubscribe = this.#engine.subscribe(({ reading, range, duringDrag }) => {
            if (range !== lastRange) {
                this.#renderLine(range);
                lastRange = range;
            }
            this.#renderMarker(reading, range, duringDrag);
        });

        return this.#root;
    }

    onEnter() {
        const reading = this.#engine.getReading();
        const range = this.#engine.getRange();
        this.#renderMarker(reading, range, false);
    }

    onLeave() {}

    destroy() {
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        return `
        <div class="flex justify-center gap-4 p-4 bg-soft-bg border-b border-soft-border shrink-0 flex-wrap">
            ${PRESET_BUTTONS.map((b, i) => `
                <button data-preset="${i}"
                        class="px-4 py-2 ${b.classes} font-bold rounded-full whitespace-nowrap">
                    ${b.label}
                </button>
            `).join('')}
            <button data-action="toggle-custom"
                    class="px-4 py-2 bg-soft-greenLight/30 text-soft-green font-bold rounded-full
                           hover:bg-soft-greenLight/50 whitespace-nowrap flex items-center gap-2">
                <i class="fas fa-sliders-h text-sm"></i>Valbar
            </button>
        </div>

        <div data-role="custom-panel"
             class="hidden flex-wrap justify-center items-center gap-3 px-4 py-3 bg-white
                    border-b border-soft-border shrink-0">
            <label class="flex items-center gap-1 font-semibold text-soft-text text-sm">
                Från:
                <input type="number" data-role="from" value="0" step="any"
                       class="ml-1 w-20 border border-soft-border rounded-lg px-2 py-1 text-center
                              font-bold text-soft-text focus:outline-none focus:ring-2 focus:ring-soft-blue/40"/>
            </label>
            <label class="flex items-center gap-1 font-semibold text-soft-text text-sm">
                Till:
                <input type="number" data-role="to" value="10" step="any"
                       class="ml-1 w-20 border border-soft-border rounded-lg px-2 py-1 text-center
                              font-bold text-soft-text focus:outline-none focus:ring-2 focus:ring-soft-blue/40"/>
            </label>
            <label class="flex items-center gap-2 font-semibold text-soft-text text-sm cursor-pointer select-none">
                <input type="radio" name="nl-step" value="10" class="w-4 h-4 accent-soft-blue"/>Tiotal (10)
            </label>
            <label class="flex items-center gap-2 font-semibold text-soft-text tex
