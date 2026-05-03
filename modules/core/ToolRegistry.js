import { appState } from './AppState.js';
import { bus }      from './EventBus.js';

// Per-tool header-button color, matching each tool's accent.
// Tools not listed fall back to soft-blue.
const FULLSCREEN_BTN_COLORS = {
    fractions:       'bg-soft-pink text-white',
    numberlines:     'bg-soft-blue text-white',
    geometry:        'bg-soft-green text-white',
    counting:        'bg-soft-yellowDark text-white',
    clock:           'bg-soft-purple text-white',
    statistics:      'bg-soft-teal text-white',
    koordinat:       'bg-soft-purple text-white',
    positionssystem: 'bg-soft-blue text-white',
    volym:           'bg-soft-blue text-white',
    decimaltal:      'bg-soft-teal text-white',
    scale:           'bg-soft-blue text-white',
};

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

        // Build the right-side controls: tool-specific buttons (if any),
        // followed by the fullscreen button (only on non-home tools).
        this.#controlsArea.innerHTML = '';
        if (tool.headerControls) {
            this.#controlsArea.append(...tool.headerControls());
        }
        if (tool.id !== 'home') {
            this.#controlsArea.append(this.#buildFullscreenButton(tool.id));
        }

        tool.onEnter?.();
    }

    #leave(toolId) {
        const tool = this.#tools.get(toolId);
        tool?.onLeave?.();
    }

    #buildFullscreenButton(toolId) {
        const colorCls = FULLSCREEN_BTN_COLORS[toolId] || 'bg-soft-blue text-white';
        const btn = document.createElement('button');
        btn.className = `flex items-center gap-2 px-4 py-2 ${colorCls} font-bold
                         rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm`;
        btn.innerHTML = '<i class="fas fa-expand"></i> Helskärm';
        btn.addEventListener('click', () => this.#toggleFullscreen());
        return btn;
    }

    async #toggleFullscreen() {
        const root = document.documentElement;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else if (root.requestFullscreen) {
            await root.requestFullscreen();
        }
    }
}
