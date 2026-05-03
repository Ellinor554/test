// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/ClockView.js
//
// The View half of the Clock tool. Renders the analog SVG, the digital
// readout panels, the layer toggle buttons, and the Swedish label list.
// Talks to the engine through commands (adjustMinutes, rotate*Hand,
// snapToMinute, toggleLayer) and one subscription.
// ═══════════════════════════════════════════════════════════════════════════

import { ClockEngine } from './ClockEngine.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 170, CY = 170;

const LAYER_BUTTONS = [
    { layer: 'hours12', label: 'Timmar 1–12',         color: '#1a2e5a' },
    { layer: 'hours24', label: '+ Timmar 13–24',      color: '#c07000' },
    { layer: 'minutes', label: '+ Minuter (+5, +10…)', color: '#1a6060' },
    { layer: 'digital', label: 'Digital klocka',      color: '#6d28d9' },
];

const SWEDISH_LABELS = [
    { m: 0,  text: 'hel' },
    { m: 5,  text: 'fem över' },
    { m: 10, text: 'tio över' },
    { m: 15, text: 'kvart över' },
    { m: 20, text: 'tjugo över' },
    { m: 25, text: 'fem i halv' },
    { m: 30, text: 'halv' },
    { m: 35, text: 'fem över halv' },
    { m: 40, text: 'tjugo i' },
    { m: 45, text: 'kvart i' },
    { m: 50, text: 'tio i' },
    { m: 55, text: 'fem i' },
];

export class ClockView {
    #engine;
    #unsubscribe;
    #root;
    #els = {};
    #dragInitialized = false;

    constructor(engine = new ClockEngine()) {
        this.#engine = engine;
    }

    get engine() { return this.#engine; }

    mount(parent) {
        this.#root = document.createElement('section');
        this.#root.id = 'view-clock';
        this.#root.className = 'flex-col md:flex-row h-full items-center justify-center bg-soft-bg gap-10 p-6 overflow-auto';
        this.#root.innerHTML = this.#template();
        parent.appendChild(this.#root);

        this.#cacheRefs();
        this.#drawClockFace();
        this.#wireEvents();

        this.#unsubscribe = this.#engine.subscribe(({ reading, layers }) => {
            this.#renderHands(reading);
            this.#renderDigital(reading);
            this.#renderLayers(layers);
            this.#renderHighlights(reading);
        });

        return this.#root;
    }

    onEnter() {
        if (!this.#dragInitialized) {
            this.#initDrag();
            this.#dragInitialized = true;
        }
    }

    onLeave() {}

    destroy() {
        this.#unsubscribe?.();
        this.#root?.remove();
    }

    #template() {
        return `
        <div data-role="left-panel"
             class="flex flex-col items-center gap-5 bg-white p-7 rounded-3xl shadow-lg
                    border border-soft-border w-full max-w-xs shrink-0">

            <div class="w-full">
                <h3 class="text-sm font-bold text-soft-muted uppercase tracking-widest mb-3">Lager</h3>
                <div class="flex flex-col gap-2 w-full">
                    ${LAYER_BUTTONS.map(b => `
                        <button data-toggle-layer="${b.layer}"
                                class="w-full py-2.5 rounded-lg font-bold text-sm border transition-colors">
                            ${b.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div data-role="digital-section" class="w-full flex flex-col items-center gap-5">
                <hr class="w-full" style="border-color:#d6d4d0;">
                <h3 class="text-sm font-bold text-soft-muted uppercase tracking-widest">Digital tid</h3>

                <div data-role="panel-fm" class="w-full rounded-2xl border-2 p-4 transition-all"
                     style="border-color:#d6d4d0; opacity:0.45;">
                    <div class="text-xs font-bold mb-2 uppercase tracking-wider" style="color:#1a2e5a;">Förmiddag</div>
                    <div class="text-4xl font-mono font-bold flex items-center gap-1" style="color:#1a2e5a;">
                        <span data-role="digital-h-fm">10</span>
                        <span class="opacity-40 text-2xl pb-1">:</span>
                        <span data-role="digital-m-fm">00</span>
                    </div>
                    <div class="text-xs text-soft-muted mt-1 font-semibold">00:00 – 11:59</div>
                </div>

                <div data-role="panel-em" class="w-full rounded-2xl border-2 p-4 transition-all"
                     style="border-color:#d6d4d0; opacity:0.45;">
                    <div class="text-xs font-bold mb-2 uppercase tracking-wider" style="color:#1a2e5a;">Eftermiddag</div>
                    <div class="text-4xl font-mono font-bold flex items-center gap-1" style="color:#1a2e5a;">
                        <span data-role="digital-h-em">22</span>
                        <span class="opacity-40 text-2xl pb-1">:</span>
                        <span data-role="digital-m-em">00</span>
                    </div>
                    <div class="text-xs text-soft-muted mt-1 font-semibold">12:00 – 23:59</div>
                </div>
            </div>

            <div class="flex gap-3 w-full">
                <button data-adjust="-60" class="flex-1 bg-soft-bg hover:bg-soft-border py-2.5
                        rounded-lg font-bold text-soft-text border border-soft-border text-sm">−1 tim</button>
                <button data-adjust="60" class="flex-1 bg-soft-bg hover:bg-soft-border py-2.5
                        rounded-lg font-bold text-soft-text border border-soft-border text-sm">+1 tim</button>
            </div>
            <div class="flex gap-3 w-full">
                <button data-adjust="-1" class="flex-1 bg-soft-bg hover:bg-soft-border py-2.5
                        rounded-lg font-bold text-soft-text border border-soft-border text-sm">−1 min</button>
                <button data-adjust="1" class="flex-1 bg-soft-bg hover:bg-soft-border py-2.5
                        rounded-lg font-bold text-soft-text border border-soft-border text-sm">+1 min</button>
            </div>

            <p class="text-xs text-soft-muted text-center leading-relaxed">
                <i class="fas fa-hand-pointer mr-1"></i>Dra den
                <span style="color:#c0392b;font-weight:700;">röda</span> minutvisaren eller den
                <span style="color:#1a2e5a;font-weight:700;">blå</span> timvisaren för att ändra tiden.
            </p>
        </div>

        <div class="flex items-center justify-center select-none shrink-0">
            <svg data-role="svg" viewBox="0 0 340 340"
                 style="width:min(520px,92vw);height:min(520px,92vw);">
                <circle data-role="teal-ring" cx="170" cy="170" r="165"
                        fill="#7ec8c8" stroke="#5aabab" stroke-width="1.5"/>
                <g data-role="minute-ring"></g>
                <circle cx="170" cy="170" r="138" fill="white" stroke="#e8e5e0" stroke-width="2"/>
                <g data-role="ticks"></g>
                <g data-role="numbers-24"></g>
                <g data-role="numbers-12"></g>
                <line data-role="hand-hour"
                      x1="170" y1="170" x2="170" y2="100"
                      stroke="#1a2e5a" stroke-width="7" stroke-linecap="round"
                      class="clock-hand" transform="rotate(0 170 170)"/>
                <line data-role="hand-minute"
                      x1="170" y1="170" x2="170" y2="48"
                      stroke="#c0392b" stroke-width="4.5" stroke-linecap="round"
                      class="clock-hand" transform="rotate(0 170 170)"/>
                <circle cx="170" cy="170" r="7" fill="#1a2e5a"/>
                <circle cx="170" cy="170" r="3.5" fill="#c0392b"/>
            </svg>
        </div>

        <div data-role="right-panel"
             class="flex flex-col bg-white p-5 rounded-3xl shadow-lg border border-soft-border
                    w-full max-w-xs shrink-0">
            <h3 class="text-sm font-bold text-soft-muted uppercase tracking-widest mb-3">Vad är klockan?</h3>
            <div class="flex flex-col gap-0.5">
                ${SWEDISH_LABELS.map(({ m, text }) => `
                    <div data-label-minute="${m}"
                         class="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                         style="transition:background 0.15s;">
                        <span class="font-mono font-bold text-sm w-9" style="color:#1a6060;">
                            :${String(m).padStart(2,'0')}
                        </span>
                        <span class="text-sm font-semibold" style="color:#1a2e5a;">${text}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    #cacheRefs() {
        const $ = sel => this.#root.querySelector(sel);
        const $$ = sel => this.#root.querySelectorAll(sel);
        this.#els = {
            svg:           $('[data-role="svg"]'),
            tealRing:      $('[data-role="teal-ring"]'),
            minuteRing:    $('[data-role="minute-ring"]'),
            ticks:         $('[data-role="ticks"]'),
            numbers12:     $('[data-role="numbers-12"]'),
            numbers24:     $('[data-role="numbers-24"]'),
            handHour:      $('[data-role="hand-hour"]'),
            handMinute:    $('[data-role="hand-minute"]'),
            digitalSection: $('[data-role="digital-section"]'),
            panelFM:       $('[data-role="panel-fm"]'),
            panelEM:       $('[data-role="panel-em"]'),
            digitalHfm:    $('[data-role="digital-h-fm"]'),
            digitalMfm:    $('[data-role="digital-m-fm"]'),
            digitalHem:    $('[data-role="digital-h-em"]'),
            digitalMem:    $('[data-role="digital-m-em"]'),
            layerButtons:  $$('[data-toggle-layer]'),
            swedishLabels: $$('[data-label-minute]'),
        };
    }

    #wireEvents() {
        this.#root.addEventListener('click', evt => {
            const adjustBtn = evt.target.closest('[data-adjust]');
            if (adjustBtn) {
                this.#engine.adjustMinutes(Number(adjustBtn.dataset.adjust));
                return;
            }
            const layerBtn = evt.target.closest('[data-toggle-layer]');
            if (layerBtn) {
                this.#engine.toggleLayer(layerBtn.dataset.toggleLayer);
            }
        });
    }

    #initDrag() {
        this.#setupHandDrag(this.#els.handMinute, 'minute');
        this.#setupHandDrag(this.#els.handHour,   'hour');
    }

    #setupHandDrag(handEl, type) {
        let dragging = false;
        let lastAngle = 0;

        const getAngleAt = e => {
            const ctm = this.#els.svg.getScreenCTM();
            if (!ctm) return null;
            const pt = this.#els.svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const local = pt.matrixTransform(ctm.inverse());
            return Math.atan2(local.y - CY, local.x - CX) * 180 / Math.PI;
        };

        handEl.addEventListener('pointerdown', e => {
            if (!this.#els.svg.getScreenCTM()) return;
            dragging = true;
            handEl.setPointerCapture(e.pointerId);
            lastAngle = getAngleAt(e);
            e.preventDefault();
        });

        handEl.addEventListener('pointermove', e => {
            if (!dragging) return;
            const cur = getAngleAt(e);
            if (cur === null) return;
            let diff = cur - lastAngle;
            if (diff >  180) diff -= 360;
            if (diff < -180) diff += 360;
            lastAngle = cur;
            if (type === 'minute') this.#engine.rotateMinuteHand(diff);
            else                   this.#engine.rotateHourHand(diff);
        });

        handEl.addEventListener('pointerup', e => {
            dragging = false;
            handEl.releasePointerCapture(e.pointerId);
            this.#engine.snapToMinute();
        });
    }

    #drawClockFace() {
        this.#drawMinuteRing();
        this.#drawTicks();
        this.#draw24Numbers();
        this.#draw12Numbers();
    }

    #drawMinuteRing() {
        const ring = this.#els.minuteRing;
        ring.innerHTML = '';
        for (let m = 0; m < 60; m++) {
            const angle = m * 6;
            if (m % 5 !== 0) {
                const inner = polar(CX, CY, 148, angle);
                const outer = polar(CX, CY, 158, angle);
                const tick = document.createElementNS(SVG_NS, 'line');
                setAttrs(tick, {
                    x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y,
                    stroke: 'rgba(255,255,255,0.7)', 'stroke-width': '1.5',
                });
                ring.appendChild(tick);
            } else {
                const bPos = polar(CX, CY, 154, angle);
                const minsLabel = m === 0 ? ':00' : `:${String(m).padStart(2,'0')}`;

                const circ = document.createElementNS(SVG_NS, 'circle');
                setAttrs(circ, { cx: bPos.x, cy: bPos.y, r: 11, fill: 'white', opacity: 0.92 });
                ring.appendChild(circ);

                const txt = document.createElementNS(SVG_NS, 'text');
                setAttrs(txt, {
                    x: bPos.x, y: bPos.y + 4, 'text-anchor': 'middle',
                    'font-family': 'Nunito,sans-serif', 'font-size': 8.5,
                    'font-weight': 800, fill: '#1a6060',
                });
                txt.textContent = minsLabel;
                ring.appendChild(txt);
            }
        }
    }

    #drawTicks() {
        const ticks = this.#els.ticks;
        ticks.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const angle = i * 6;
            const isHour = i % 5 === 0;
            const r1 = isHour ? 118 : 125;
            const p1 = polar(CX, CY, r1, angle);
            const p2 = polar(CX, CY, 136, angle);
            const line = document.createElementNS(SVG_NS, 'line');
            setAttrs(line, {
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                stroke: isHour ? '#c8c4be' : '#e0ddd8',
                'stroke-width': isHour ? '2.5' : '1',
            });
            ticks.appendChild(line);
        }
    }

    #draw24Numbers() {
        const g = this.#els.numbers24;
        g.innerHTML = '';
        for (let h = 13; h <= 24; h++) {
            const hour12 = h === 24 ? 0 : h - 12;
            const angle = hour12 * 30;
            const pos = polar(CX, CY, 103, angle);
            const txt = document.createElementNS(SVG_NS, 'text');
            setAttrs(txt, {
                x: pos.x, y: pos.y + 4.5, 'text-anchor': 'middle',
                'font-family': 'Nunito,sans-serif',
                'font-size': h === 24 ? 12 : 10.5,
                'font-weight': 700, fill: '#c07000',
            });
            txt.textContent = String(h);
            g.appendChild(txt);
        }
    }

    #draw12Numbers() {
        const g = this.#els.numbers12;
        g.innerHTML = '';
        for (let h = 1; h <= 12; h++) {
            const angle = h * 30;
            const pos = polar(CX, CY, 76, angle);
            const txt = document.createElementNS(SVG_NS, 'text');
            setAttrs(txt, {
                x: pos.x, y: pos.y + 6, 'text-anchor': 'middle',
                'font-family': 'Nunito,sans-serif', 'font-size': 18,
                'font-weight': 800, fill: '#1a2e5a',
            });
            txt.textContent = String(h);
            g.appendChild(txt);
        }
    }

    #renderHands(reading) {
        this.#els.handHour.setAttribute('transform',   `rotate(${reading.hourAngleDeg} 170 170)`);
        this.#els.handMinute.setAttribute('transform', `rotate(${reading.minuteAngleDeg} 170 170)`);
    }

    #renderDigital(reading) {
        const mm = String(reading.minutes).padStart(2, '0');
        this.#els.digitalHfm.textContent = String(reading.amHour).padStart(2, '0');
        this.#els.digitalMfm.textContent = mm;
        this.#els.digitalHem.textContent = String(reading.pmHour).padStart(2, '0');
        this.#els.digitalMem.textContent = mm;

        const active   = reading.isMorning ? this.#els.panelFM : this.#els.panelEM;
        const inactive = reading.isMorning ? this.#els.panelEM : this.#els.panelFM;
        active.style.opacity     = '1';
        active.style.borderColor = '#1a2e5a';
        active.style.background  = '#f0f3f8';
        inactive.style.opacity     = '0.38';
        inactive.style.borderColor = '#d6d4d0';
        inactive.style.background  = 'white';
    }

    #renderLayers(layers) {
        if (this.#els.numbers12)  this.#els.numbers12.style.display = layers.hours12 ? '' : 'none';
        if (this.#els.numbers24)  this.#els.numbers24.style.display = layers.hours24 ? '' : 'none';
        if (this.#els.tealRing)   this.#els.tealRing.style.display  = layers.minutes ? '' : 'none';
        if (this.#els.minuteRing) this.#els.minuteRing.style.display = layers.minutes ? '' : 'none';
        if (this.#els.digitalSection)
            this.#els.digitalSection.style.display = layers.digital ? '' : 'none';

        for (const btn of this.#els.layerButtons) {
            const layerName = btn.dataset.toggleLayer;
            const config = LAYER_BUTTONS.find(b => b.layer === layerName);
            const active = layers[layerName];
            btn.style.background  = active ? config.color : '#f4f3ef';
            btn.style.color       = active ? 'white'      : '#4a4b50';
            btn.style.borderColor = active ? config.color : '#d6d4d0';
        }
    }

    #renderHighlights(reading) {
        const bubbles = this.#els.minuteRing.querySelectorAll('circle');
        bubbles.forEach(c => {
            c.setAttribute('fill', 'white');
            c.setAttribute('opacity', '0.92');
        });
        const bubbleIndex = reading.nearestFiveMinute / 5;
        if (bubbles[bubbleIndex]) {
            bubbles[bubbleIndex].setAttribute('fill', '#ffe066');
            bubbles[bubbleIndex].setAttribute('opacity', '1');
        }

        for (const label of this.#els.swedishLabels) {
            const m = Number(label.dataset.labelMinute);
            label.style.background = m === reading.nearestFiveMinute ? '#ffe066' : '';
        }
    }
}

function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function setAttrs(el, attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
}
