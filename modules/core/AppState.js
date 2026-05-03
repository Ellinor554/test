import { bus } from './EventBus.js';

const HOME_ID = 'home';

export class AppState {
    #activeToolId = HOME_ID;
    #presenting   = false;

    snapshot() {
        return Object.freeze({
            activeToolId: this.#activeToolId,
            presenting:   this.#presenting,
            isHome:       this.#activeToolId === HOME_ID,
        });
    }

    activate(toolId) {
        if (toolId === this.#activeToolId) return;
        const previous = this.#activeToolId;
        this.#activeToolId = toolId;

        bus.publish('tool:deactivated', { toolId: previous });
        bus.publish('tool:activated',   { toolId });
        bus.publish('state:changed',    this.snapshot());
    }

    setPresenting(flag) {
        if (flag === this.#presenting) return;
        this.#presenting = !!flag;
        bus.publish('state:changed', this.snapshot());
    }
}

export const appState = new AppState();
