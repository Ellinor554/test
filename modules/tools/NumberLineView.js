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
            <label class="flex items-center gap-2 font-semibold text-soft-text text-sm cursor-pointer select-none">
                <input type="radio" name="nl-step" value="1" checked class="w-4 h-4 accent-soft-blue"/>Ental (1)
            </label>
            <label class="flex items-center gap-2 font-semibold text-soft-text text-sm cursor-pointer select-none">
                <input type="radio" name="nl-step" value="0.1" class="w-4 h-4 accent-soft-blue"/>Tiondelar (0,1)
            </label>
            <label class="flex items-center gap-2 font-semibold text-soft-text text-sm cursor-pointer select-none">
                <input type="radio" name="nl-step" value="0.01" class="w-4 h-4 accent-soft-blue"/>Hundradelar (0,01)
            </label>
            <button data-action="apply-custom"
                    class="px-5 py-1.5 bg-soft-blue text-white font-bold rounded-full
                           hover:bg-soft-blue/80 transition-colors text-sm">Skapa</button>
        </div>

        <div class="flex-1 relative flex items-center justify-center px-4 py-4 overflow-x-auto">
            <div data-role="container" class="relative w-full flex flex-col items-center"
                 style="min-height:220px;"></div>
        </div>`;
    }

    #cacheRefs() {
        const $ = sel => this.#root.querySelector(sel);
        const $$ = sel => this.#root.querySelectorAll(sel);
        this.#els = {
            container:    $('[data-role="container"]'),
            customPanel:  $('[data-role="custom-panel"]'),
            inputFrom:    $('[data-role="from"]'),
            inputTo:      $('[data-role="to"]'),
            stepRadios:   $$('input[name="nl-step"]'),
            presetBtns:   $$('[data-preset]'),
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const presetBtn = evt.target.closest('[data-preset]');
            if (presetBtn) {
                const preset = PRESET_BUTTONS[Number(presetBtn.dataset.preset)];
                this.#engine.setRange(preset.range);
                return;
            }
            const action = evt.target.closest('[data-action]')?.dataset.action;
            if (action === 'toggle-custom') {
                this.#els.customPanel.classList.toggle('hidden');
                this.#els.customPanel.classList.toggle('flex');
            } else if (action === 'apply-custom') {
                this.#applyCustom();
            }
        });
    }

    #applyCustom() {
        const from = parseFloat(this.#els.inputFrom.value);
        const to   = parseFloat(this.#els.inputTo.value);
        const checked = Array.from(this.#els.stepRadios).find(r => r.checked);
        const stepVal = checked ? parseFloat(checked.value) : 1;

        if (Number.isNaN(from) || Number.isNaN(to) || to <= from) {
            alert('Ange giltiga värden: "Från" måste vara mindre än "Till".');
            return;
        }
        let step, decimalPlaces;
        if (stepVal === 0.01)      { step = 0.01; decimalPlaces = 2; }
        else if (stepVal === 0.1)  { step = 0.1;  decimalPlaces = 1; }
        else                       { step = stepVal; decimalPlaces = 0; }

        try {
            this.#engine.setRange({ min: from, max: to, step, decimalPlaces });
        } catch (err) {
            alert(err.message);
        }
    }

    #renderLine(range) {
        const container = this.#els.container;
        container.innerHTML = '';

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('class', 'w-full drop-shadow-sm');
        svg.style.cssText = 'overflow:visible;display:block;flex-shrink:0;';

        const defs = document.createElementNS(SVG_NS, 'defs');
        defs.innerHTML =
            '<marker id="nl-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" ' +
            'orient="auto" markerUnits="userSpaceOnUse">' +
            '<path d="M0,0 L0,8 L10,4 Z" fill="#4a4b50"/></marker>';
        svg.appendChild(defs);

        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', PAD - 10);
        line.setAttribute('y1', LINE_Y);
        line.setAttribute('x2', W - PAD + 28);
        line.setAttribute('y2', LINE_Y);
        line.setAttribute('stroke', '#4a4b50');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('marker-end', 'url(#nl-arrow)');
        svg.appendChild(line);

        const pxPerTick = (W - 2 * PAD) / range.numTicks;
        for (let i = 0; i <= range.numTicks; i++) {
            const val = parseFloat((range.min + i * range.step).toFixed(10));
            const x = PAD + i * pxPerTick;
            const major = this.#engine.isMajorTick(val);
            const tickH = major ? 16 : 8;

            const tick = document.createElementNS(SVG_NS, 'line');
            tick.setAttribute('x1', x); tick.setAttribute('y1', LINE_Y - tickH);
            tick.setAttribute('x2', x); tick.setAttribute('y2', LINE_Y + tickH);
            tick.setAttribute('stroke', '#4a4b50');
            tick.setAttribute('stroke-width', major ? '2.5' : '1.2');
            svg.appendChild(tick);

            if (major) {
                const fontSize = range.decimalPlaces === 2 ? 11
                              : range.decimalPlaces === 1 ? 13 : 15;
                const txt = document.createElementNS(SVG_NS, 'text');
                txt.setAttribute('x', x);
                txt.setAttribute('y', LINE_Y + 36);
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('font-family', 'Nunito,sans-serif');
                txt.setAttribute('font-weight', 'bold');
                txt.setAttribute('font-size', fontSize);
                txt.setAttribute('fill', '#4a4b50');
                txt.textContent = formatValue(val, range.decimalPlaces);
                svg.appendChild(txt);
            }
        }

        container.appendChild(svg);

        const display = document.createElement('div');
        display.style.cssText =
            'display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:12px;';
        display.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <div data-role="value-display"
                     style="font-family:Nunito,sans-serif;font-size:2rem;font-weight:900;
                            color:#1a2e5a;background:#f0f3f8;border:2px solid #8db1d1;
                            border-radius:14px;padding:6px 22px;min-width:90px;
                            text-align:center;">0</div>
            </div>
            <div data-role="delta-display"
                 style="font-family:Nunito,sans-serif;font-size:1rem;font-weight:700;
                        color:#4f7c75;min-height:1.4rem;"></div>
        `;
        container.appendChild(display);

        const marker = document.createElement('div');
        marker.dataset.role = 'marker';
        marker.style.cssText =
            `position:absolute;width:${MARKER_SIZE_PX}px;top:0;left:0;cursor:grab;` +
            'user-select:none;touch-action:none;display:flex;flex-direction:column;align-items:center;';
        marker.innerHTML = `
            <div data-role="marker-label"
                 style="background:#1a2e5a;color:white;font-family:Nunito,sans-serif;
                        font-size:13px;font-weight:900;padding:3px 8px;border-radius:8px;
                        box-shadow:0 3px 10px rgba(26,46,90,0.35);white-space:nowrap;">0</div>
            <div style="width:0;height:0;border-left:9px solid transparent;
                        border-right:9px solid transparent;border-top:12px solid #1a2e5a;
                        margin-top:-1px;filter:drop-shadow(0 2px 3px rgba(26,46,90,0.2));"></div>
        `;
        container.appendChild(marker);

        this.#els.svg          = container.querySelector('svg');
        this.#els.valueDisplay = container.querySelector('[data-role="value-display"]');
        this.#els.deltaDisplay = container.querySelector('[data-role="delta-display"]');
        this.#els.marker       = marker;
        this.#els.markerLabel  = marker.querySelector('[data-role="marker-label"]');

        this.#wireMarkerDrag();
    }

    #wireMarkerDrag() {
        const marker = this.#els.marker;
        let dragging = false;
        let dragStartX = 0;
        let markerStartLeft = 0;
        let valueAtDragStart = 0;

        marker.addEventListener('pointerdown', e => {
            dragging = true;
            dragStartX = e.clientX;
            markerStartLeft = parseFloat(marker.style.left) || 0;
            valueAtDragStart = this.#engine.getReading().value;
            marker.setPointerCapture(e.pointerId);
            marker.style.cursor = 'grabbing';
            e.preventDefault();
        });

        marker.addEventListener('pointermove', e => {
            if (!dragging) return;
            const newLeft = markerStartLeft + (e.clientX - dragStartX);
            const rawVal = this.#containerXToValue(newLeft);
            this.#engine.setValueRaw(rawVal);
        });

        marker.addEventListener('pointerup', e => {
            dragging = false;
            marker.style.cursor = 'grab';
            marker.releasePointerCapture(e.pointerId);
            this.#engine.commitDrag(valueAtDragStart);
        });
    }

    #renderMarker(reading, range, duringDrag) {
        if (!this.#els.marker) return;

        const x = this.#valueToContainerX(reading.value, range);
        this.#els.marker.style.left = x + 'px';

        const svgRect = this.#els.svg.getBoundingClientRect();
        const conRect = this.#els.container.getBoundingClientRect();
        const topOffset = svgRect.top - conRect.top;
        this.#els.marker.style.top =
            (topOffset + (LINE_Y / H) * svgRect.height - ARROW_HEIGHT_PX) + 'px';

        const valStr = formatValue(reading.value, range.decimalPlaces);
        this.#els.markerLabel.textContent  = valStr;
        this.#els.valueDisplay.textContent = valStr;

        if (!duringDrag && reading.previousValue !== null && reading.delta !== 0) {
            const arrow  = reading.delta > 0 ? '→' : '←';
            const sign   = reading.delta > 0 ? '+' : '';
            this.#els.deltaDisplay.textContent =
                `${reading.formattedPrev} ${arrow} ${reading.formatted}  (${sign}${reading.formattedDelta})`;
            this.#els.deltaDisplay.style.color = reading.delta > 0 ? '#4f7c75' : '#a85c72';
        } else if (reading.previousValue === null) {
            this.#els.deltaDisplay.textContent = '';
        }
    }

    #valueToContainerX(value, range) {
        const svgRect = this.#els.svg.getBoundingClientRect();
        const conRect = this.#els.container.getBoundingClientRect();
        const svgOffsetX = svgRect.left - conRect.left;
        const ratio = svgRect.width / W;
        const pxPerTick = (W - 2 * PAD) / range.numTicks;
        const ticksFromMin = (value - range.min) / range.step;
        return svgOffsetX + (PAD + ticksFromMin * pxPerTick) * ratio - MARKER_SIZE_PX / 2;
    }

    #containerXToValue(px) {
        const range = this.#engine.getRange();
        const svgRect = this.#els.svg.getBoundingClientRect();
        const conRect = this.#els.container.getBoundingClientRect();
        const svgOffsetX = svgRect.left - conRect.left;
        const ratio = svgRect.width / W;
        const pxPerTick = (W - 2 * PAD) / range.numTicks;
        const raw = (px + MARKER_SIZE_PX / 2 - svgOffsetX) / ratio;
        const ticks = (raw - PAD) / pxPerTick;
        return range.min + ticks * range.step;
    }
}
