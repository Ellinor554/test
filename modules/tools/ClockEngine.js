// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/ClockEngine.js
//
// Pure domain model for the Clock (Klockan) tool. Knows nothing about
// SVG, the DOM, or how anyone draws an analog face. It only cares about
// "what time is it now" and "which visual layers are switched on".
//
// Time is stored as one float (totalMinutes) so that smooth dragging
// works without rounding artefacts. Everything callers need — hours,
// minutes, hand angles in degrees, AM/PM, the rounded "nearest five
// minutes" used for highlighting Swedish labels — is computed in
// getReading() and handed back as a frozen snapshot.
// ═══════════════════════════════════════════════════════════════════════════

const MINUTES_PER_HOUR  = 60;
const MINUTES_PER_DAY   = 24 * MINUTES_PER_HOUR;
const DEG_PER_MINUTE    = 360 / 60;          // minute hand: 6° per minute
const DEG_PER_HOUR_FULL = 360 / 12;          // hour hand: 30° per hour

const DEFAULT_LAYERS = Object.freeze({
    hours12: true,
    hours24: false,
    minutes: false,
    digital: true,
});

export class ClockEngine {
    #totalMinutes;
    #layers;
    #listeners = new Set();

    constructor({ initialHours = 10, initialMinutes = 10, layers = {} } = {}) {
        this.#totalMinutes = initialHours * MINUTES_PER_HOUR + initialMinutes;
        this.#layers = { ...DEFAULT_LAYERS, ...layers };
    }

    adjustMinutes(deltaMinutes) {
        if (!Number.isFinite(deltaMinutes)) return;
        this.#totalMinutes = wrap(this.#totalMinutes + deltaMinutes);
        this.#emit();
    }

    rotateMinuteHand(deltaDeg) {
        if (!Number.isFinite(deltaDeg)) return;
        this.#totalMinutes = wrap(this.#totalMinutes + deltaDeg / DEG_PER_MINUTE);
        this.#emit();
    }

    rotateHourHand(deltaDeg) {
        if (!Number.isFinite(deltaDeg)) return;
        this.#totalMinutes = wrap(this.#totalMinutes + (deltaDeg / DEG_PER_HOUR_FULL) * MINUTES_PER_HOUR);
        this.#emit();
    }

    snapToMinute() {
        const snapped = Math.round(this.#totalMinutes);
        const wrapped = wrap(snapped);
        if (wrapped === this.#totalMinutes) return;
        this.#totalMinutes = wrapped;
        this.#emit();
    }

    toggleLayer(layerName) {
        if (!(layerName in this.#layers)) {
            throw new Error(`Unknown clock layer: "${layerName}"`);
        }
        this.#layers[layerName] = !this.#layers[layerName];
        this.#emit();
    }

    getReading() {
        const total      = this.#totalMinutes;
        const minutesInt = Math.round(total);
        const wrapped    = ((minutesInt % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

        const hours   = Math.floor(wrapped / MINUTES_PER_HOUR);
        const minutes = wrapped % MINUTES_PER_HOUR;

        const minuteAngleDeg = (total * DEG_PER_MINUTE) % 360;
        const hourAngleDeg   = (((total / MINUTES_PER_HOUR) % 12) * DEG_PER_HOUR_FULL + 360) % 360;

        const isMorning = hours < 12;
        const amHour    = isMorning ? hours : hours - 12;
        const pmHour    = isMorning ? hours + 12 : hours;

        return Object.freeze({
            totalMinutes:      total,
            hours, minutes,
            minuteAngleDeg, hourAngleDeg,
            isMorning, amHour, pmHour,
            nearestFiveMinute: (Math.round(minutes / 5) * 5) % 60,
        });
    }

    getLayers() {
        return Object.freeze({ ...this.#layers });
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        listener({ reading: this.getReading(), layers: this.getLayers() });
        return () => this.#listeners.delete(listener);
    }

    #emit() {
        const payload = { reading: this.getReading(), layers: this.getLayers() };
        for (const listener of this.#listeners) {
            try { listener(payload); }
            catch (err) { console.error('[ClockEngine] listener threw:', err); }
        }
    }
}

function wrap(totalMinutes) {
    return ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export const CLOCK_CONSTANTS = Object.freeze({
    MINUTES_PER_HOUR, MINUTES_PER_DAY, DEG_PER_MINUTE, DEG_PER_HOUR_FULL,
});
