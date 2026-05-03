const ML_PER_LITER     = 1000;
const ML_PER_DECILITER = 100;
const ML_PER_CENTILITER = 10;
const BEAKER_CAPACITY_ML = 1000;

export class VolumeEngine {
    #totalMl = 0;
    #listeners = new Set();

    addLiquid(amountMl) {
        if (!Number.isFinite(amountMl) || amountMl < 0) {
            throw new RangeError(`addLiquid: expected non-negative number, got ${amountMl}`);
        }
        this.#totalMl += amountMl;
        this.#emit();
    }

    empty() {
        if (this.#totalMl === 0) return;
        this.#totalMl = 0;
        this.#emit();
    }

    getReading() {
        const total = this.#totalMl;
        const liters      = Math.floor(total / ML_PER_LITER);
        const deciliters  = Math.floor((total % ML_PER_LITER) / ML_PER_DECILITER);
        const centiliters = Math.floor((total % ML_PER_DECILITER) / ML_PER_CENTILITER);
        const milliliters = total % ML_PER_CENTILITER;

        const beakers = [];
        const fullCount = Math.floor(total / BEAKER_CAPACITY_ML);
        const remainder = total % BEAKER_CAPACITY_ML;
        for (let i = 0; i < fullCount; i++) {
            beakers.push({ capacityMl: BEAKER_CAPACITY_ML, contentsMl: BEAKER_CAPACITY_ML, fillRatio: 1 });
        }
        if (remainder > 0 || beakers.length === 0) {
            beakers.push({
                capacityMl: BEAKER_CAPACITY_ML,
                contentsMl: remainder,
                fillRatio:  remainder / BEAKER_CAPACITY_ML,
            });
        }

        return Object.freeze({
            totalMl: total,
            liters, deciliters, centiliters, milliliters,
            beakers, isEmpty: total === 0,
        });
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        listener(this.getReading());
        return () => this.#listeners.delete(listener);
    }

    #emit() {
        const reading = this.getReading();
        for (const listener of this.#listeners) {
            try { listener(reading); }
            catch (err) { console.error('[VolumeEngine] listener threw:', err); }
        }
    }
}

export function formatLiters(amountMl) {
    const liters = amountMl / ML_PER_LITER;
    return liters.toLocaleString('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    }) + ' L';
}

export const VOLUME_CONSTANTS = Object.freeze({
    ML_PER_LITER, ML_PER_DECILITER, ML_PER_CENTILITER, BEAKER_CAPACITY_ML,
});
