import { VolumeEngine, formatLiters, VOLUME_CONSTANTS } from './VolumeEngine.js';

const { BEAKER_CAPACITY_ML } = VOLUME_CONSTANTS;

const BEAKER_PX_HEIGHT  = 500;
const BEAKER_PX_WIDTH   = 200;
const BEAKER_BORDER_PX  = 3;
const BEAKER_INNER_H    = BEAKER_PX_HEIGHT - BEAKER_BORDER_PX;
const SCALE_PX_WIDTH    = 68;

export class VolumeView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};

    constructor(engine = new VolumeEngine()) {
        this.#engine = engine;
    }

    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-volym';
        this.#root.className = 'flex-row h-full';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#wireEvents();

        this.#unsubscribe = this.#engine.subscribe(reading => this.#render(reading));

        return this.#root;
    }

    onEnter() {
        this.#render(this.#engine.getReading());
    }

    onLeave() {}

    destroy() {
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        return `
        <aside class="w-64 bg-soft-surface shadow-md z-10 p-5 flex flex-col gap-3
                      overflow-y-auto border-r border-soft-border shrink-0">
            <h3 class="font-bold text-sm uppercase tracking-wider text-soft-muted">
                Lägg till mängd
            </h3>
            <button class="vol-add-btn" data-add-ml="1000">
                <span class="w-8 h-8 rounded-lg bg-soft-blue text-white flex items-center
                             justify-center font-bold text-sm shrink-0">L</span>
                <span>+ 1 Liter (L)</span>
            </button>
            <button class="vol-add-btn" data-add-ml="100">
                <span class="w-8 h-8 rounded-lg bg-soft-blueLight text-white flex items-center
                             justify-center font-bold text-sm shrink-0">dl</span>
                <span>+ 1 Deciliter (dl)</span>
            </button>
            <button class="vol-add-btn" data-add-ml="10">
                <span class="w-8 h-8 rounded-lg bg-soft-greenLight text-white flex items-center
                             justify-center font-bold text-sm shrink-0">cl</span>
                <span>+ 1 Centiliter (cl)</span>
            </button>
            <button class="vol-add-btn" data-add-ml="1">
                <span class="w-8 h-8 rounded-lg bg-soft-green text-white flex items-center
                             justify-center font-bold text-sm shrink-0">ml</span>
                <span>+ 1 Milliliter (ml)</span>
            </button>

            <hr class="border-soft-border mt-1"/>

            <div>
                <h4 class="font-bold text-xs uppercase tracking-wider text-soft-muted mb-3">
                    Representation
                </h4>
                <div class="flex justify-between gap-2">
                    <div class="vol-repr-box">
                        <div class="vol-repr-digit" data-digit="liters">0</div>
                        <div class="vol-repr-unit">L</div>
                    </div>
                    <div class="vol-repr-box">
                        <div class="vol-repr-digit" data-digit="deciliters">0</div>
                        <div class="vol-repr-unit">dl</div>
                    </div>
                    <div class="vol-repr-box">
                        <div class="vol-repr-digit" data-digit="centiliters">0</div>
                        <div class="vol-repr-unit">cl</div>
                    </div>
                    <div class="vol-repr-box">
                        <div class="vol-repr-digit" data-digit="milliliters">0</div>
                        <div class="vol-repr-unit">ml</div>
                    </div>
                </div>
                <div class="mt-3 p-3 bg-soft-blueLight/10 border border-soft-blueLight/25
                            rounded-xl text-xs text-soft-blue leading-relaxed">
                    Totalt: <span data-role="total" class="font-bold">0 L</span>
                </div>
            </div>

            <hr class="border-soft-border"/>

            <button data-action="empty"
                    class="bg-soft-text hover:bg-soft-muted text-white p-2 rounded-lg
                           text-sm font-semibold mt-auto">
                <i class="fas fa-trash mr-1"></i> Töm behållaren
            </button>
        </aside>

        <div class="flex-1 flex items-center justify-center bg-soft-bg overflow-auto p-8">
            <div class="flex items-end gap-8 flex-wrap justify-center">
                <div data-role="beakers" class="flex items-end gap-6 flex-wrap justify-center"></div>
            </div>
        </div>`;
    }

    #cacheRefs() {
        const $ = sel => this.#root.querySelector(sel);
        this.#els = {
            beakerRow: $('[data-role="beakers"]'),
            total:     $('[data-role="total"]'),
            digits: {
                liters:      $('[data-digit="liters"]'),
                deciliters:  $('[data-digit="deciliters"]'),
                centiliters: $('[data-digit="centiliters"]'),
                milliliters: $('[data-digit="milliliters"]'),
            },
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const addBtn = evt.target.closest('[data-add-ml]');
            if (addBtn) {
                this.#engine.addLiquid(Number(addBtn.dataset.addMl));
                return;
            }
            const actionBtn = evt.target.closest('[data-action]');
            if (actionBtn?.dataset.action === 'empty') {
                this.#engine.empty();
            }
        });
    }

    #render(reading) {
        this.#renderBeakers(reading.beakers);
        this.#renderDigits(reading);
        this.#els.total.textContent = formatLiters(reading.totalMl);
    }

    #renderBeakers(beakers) {
        const row = this.#els.beakerRow;
        const existing = row.querySelectorAll('.vol-beaker-outer');
        if (existing.length !== beakers.length) {
            row.innerHTML = beakers.map(b => this.#beakerHTML(b)).join('');
            return;
        }
        const last       = beakers[beakers.length - 1];
        const lastEl     = existing[existing.length - 1];
        const liquidEl   = lastEl.querySelector('.vol-liquid');
        const labelEl    = lastEl.querySelector('.vol-surface-label');
        const fillPx     = last.fillRatio * BEAKER_INNER_H;
        liquidEl.style.height = (last.fillRatio * 100) + '%';
        labelEl.textContent   = formatLiters(last.contentsMl);
        labelEl.style.bottom  = Math.max(fillPx + 4, 4) + 'px';
        labelEl.style.display = last.contentsMl > 0 ? 'block' : 'none';
    }

    #renderDigits({ liters, deciliters, centiliters, milliliters }) {
        const map = { liters, deciliters, centiliters, milliliters };
        for (const [key, value] of Object.entries(map)) {
            const el = this.#els.digits[key];
            el.textContent = value;
            el.classList.toggle('active', value > 0);
        }
    }

    #beakerHTML(beaker) {
        const fillPct     = beaker.fillRatio * 100;
        const fillPx      = beaker.fillRatio * BEAKER_INNER_H;
        const labelBottom = Math.max(fillPx + 4, 4);
        const showLabel   = beaker.contentsMl > 0;
        const labelText   = formatLiters(beaker.contentsMl);

        return `
        <div class="relative flex items-end gap-0">
            <div class="relative shrink-0"
                 style="width:${SCALE_PX_WIDTH}px; height:${BEAKER_PX_HEIGHT}px;">
                <div class="absolute inset-0">${this.#scaleHTML()}</div>
            </div>
            <div class="relative" style="flex-shrink:0;">
                <div style="width:${BEAKER_PX_WIDTH}px; height:6px;
                            border-left:3px solid rgba(91,128,165,0.55);
                            border-right:3px solid rgba(91,128,165,0.55);
                            border-top:3px solid rgba(91,128,165,0.55);
                            border-radius:4px 4px 0 0; background:transparent;"></div>
                <div class="vol-beaker-outer">
                    <div class="vol-liquid" style="height:${fillPct}%;"></div>
                    <div class="vol-surface-label"
                         style="bottom:${labelBottom}px;
                                display:${showLabel ? 'block' : 'none'};">${labelText}</div>
                </div>
            </div>
        </div>`;
    }

    #scaleHTML() {
        let html = '';
        for (let i = 0; i <= 10; i++) {
            const liters = (10 - i) / 10;
            const topPx  = Math.round((i / 10) * BEAKER_INNER_H);
            const lineW  = liters % 0.5 === 0 ? 14 : 8;
            html += `
                <div class="vol-scale-mark"
                     style="top:${topPx}px; right:0; left:0; justify-content:flex-end;">
                    <span class="vol-scale-label"
                          style="min-width:36px; text-align:right;">${liters.toFixed(1)}</span>
                    <span class="vol-scale-line" style="width:${lineW}px;"></span>
                </div>`;
        }
        return html;
    }
}
