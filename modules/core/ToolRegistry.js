import { appState } from './AppState.js';
import { bus }      from './EventBus.js';

export class ToolRegistry {
    #tools     = new Map();
    #mountEl;
    #titleEl;
    #homeBtn;
    #controlsArea;

    constructor({ mountEl, titleEl, homeBtn, controlsArea }) {
        this.#mountEl      = mountEl;
        this.#titleEl      = titleEl;
        this.#homeBtn      = homeBtn;
        this.#controlsArea = controlsArea;

        bus.subscribe('tool:activated',   ({ toolId }) => this.#enter(toolId));
        bus.subscribe('tool:deactivated', ({ toolId }) => this.#leave(toolId));

        this.#homeBtn.addEventListener('click', () => appState.activate('home'));
    }

    register(tool) {
        if (this.#tools.has(tool.id)) {
            throw new Error(`ToolRegistry: duplicate id "${tool.id}"`);
        }
        this.#tools.set(tool.id, tool);
    }

    mountActive() {
        this.#enter(appState.snapshot().activeToolId);
    }

    #enter(toolId) {
        const tool = this.#tools.get(toolId);
        if (!tool) { console.warn(`No tool registered for "${toolId}"`); return; }

        if (!tool.rootEl) {
            tool.rootEl = tool.mount(this.#mountEl);
            tool.rootEl.classList.add('tool-view');
        }

        for (const t of this.#tools.values()) {
            if (t.rootEl) t.rootEl.classList.toggle('active', t === tool);
        }

        this.#titleEl.innerHTML = tool.title;
        this.#homeBtn.classList.toggle('hidden', tool.id === 'home');
        this.#controlsArea.innerHTML = '';
        if (tool.headerControls) {
            this.#controlsArea.append(...tool.headerControls());
        }

        tool.onEnter?.();
    }

    #leave(toolId) {
        const tool = this.#tools.get(toolId);
        tool?.onLeave?.();
    }
}
