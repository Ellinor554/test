export class EventBus {
    #listeners = new Map();

    subscribe(topic, callback) {
        if (!this.#listeners.has(topic)) this.#listeners.set(topic, new Set());
        this.#listeners.get(topic).add(callback);
        return () => this.#listeners.get(topic)?.delete(callback);
    }

    publish(topic, payload) {
        const subs = this.#listeners.get(topic);
        if (!subs) return;
        for (const cb of subs) {
            try { cb(payload); }
            catch (err) { console.error(`[EventBus] ${topic} listener threw:`, err); }
        }
    }
}

export const bus = new EventBus();
