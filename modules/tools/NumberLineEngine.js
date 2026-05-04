// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/NumberLineEngine.js
// Pure model for the Tallinjer (Number Lines) tool.
// ═══════════════════════════════════════════════════════════════════════════

const PRESETS = Object.freeze({
    zeroToTen:       { min: 0, max: 10,  step: 1,    decimalPlaces: 0 },
    zeroToHundred:   { min: 0, max: 100, step: 1,    decimalPlaces: 0 },
    zeroToThreeDec:  { min: 0, max: 3,   step: 0.1,  decimalPlaces: 1 },
});

export class NumberLineEngine {
    #range;
    #currentValue;
    #previousValue = null;
    #listeners = new Set();

    constructor(initialRange = PRESETS.zeroToTen) {
        this.setRange(initialRange);
    }

    setRange({ min, max, step, decimalPlaces = 0 }) {
        if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) {
            throw new RangeError('setRange: min, max, step must be finite numbers');
        }
        if (max <= min) throw new RangeError('setRange: max must be greater than min');
        if (step <= 0)  throw new RangeError('setRange: step must be positive');

        const numTicks = Math.round((max - min) / step);
        this.#range = Object.freeze({ min, max, step, decimalPlaces, numTicks });
        this.#currentValue  = min;
        this.#previousValue = null;
        this.#emit();
    }

    setValueSnapped(value) {
        const snapped = this.#snap(value);
        if (snapped === this.#currentValue) return;
        this.#previousValue = this.#currentValue;
        this.#currentValue  = snapped;
        this.#emit();
    }

    setValueRaw(value) {
        if (!Number.isFinite(value)) return;
        const clamped = clamp(value, this.#range.min, this.#range.max);
        if (clamped === this.#currentValue) return;
        this.#currentValue = clamped;
        this.#emit({ duringDrag: true });
    }

    commitDrag(prevValueAtDragStart) {
        const snapped = this.#snap(this.#currentValue);
        this.#previousValue = prevValueAtDragStart;
        this.#currentValue  = snapped;
        this.#emit();
    }

    getRange() { return this.#range; }

    getReading() {
        const { decimalPlaces } = this.#range;
        const cur  = this.#currentValue;
        const prev = this.#previousValue;
        const delta = prev === null ? null : roundTo(cur - prev, 10);
        return Object.freeze({
            value:         cur,
            previousValue: prev,
            delta,
            decimalPlaces,
            formatted:        formatValue(cur, decimalPlaces),
            formattedPrev:    prev === null ? null : formatValue(prev, decimalPlaces),
            formattedDelta:   delta === null ? null : formatValue(delta, decimalPlaces),
        });
    }

    isMajorTick(value) {
        const { decimalPlaces, numTicks, step } = this.#range;
        if (decimalPlaces === 2) {
            return Math.abs(value * 10 - Math.round(value * 10)) < 0.001;
        }
        if (decimalPlaces === 1) {
            if (numTicks <= 30)  return true;
            if (numTicks <= 100) return Math.abs((value * 10) - Math.round(value * 10 / 5) * 5) < 0.001;
            return Math.abs(value - Math.round(value)) < step / 2;
        }
        if (numTicks > 20) return value % 10 === 0;
        if (numTicks > 10) return value % 5 === 0;
        return true;
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        listener({ reading: this.getReading(), range: this.getRange(), duringDrag: false });
        return () => this.#listeners.delete(listener);
    }

    #emit(meta = { duringDrag: false }) {
        const payload = {
            reading: this.getReading(),
            range:   this.getRange(),
            duringDrag: !!meta.duringDrag,
        };
        for (const listener of this.#listeners) {
            try { listener(payload); }
            catch (err) { console.error('[NumberLineEngine] listener threw:', err); }
        }
    }

    #snap(value) {
        const { min, step, numTicks } = this.#range;
        const tickIndex = Math.round((value - min) / step);
        const clamped = Math.max(0, Math.min(numTicks, tickIndex));
        return roundTo(min + clamped * step, 10);
    }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function formatValue(value, decimalPlaces) {
    if (decimalPlaces > 0) return value.toFixed(decimalPlaces).replace('.', ',');
    return String(value);
}

export const NUMBER_LINE_PRESETS = PRESETS;
