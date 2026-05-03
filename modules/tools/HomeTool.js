import { appState } from '../core/AppState.js';

const CARDS = [
    { id: 'volym', label: 'Volym', icon: 'fa-flask', color: 'soft-blue' },
];

export function createHomeTool() {
    let root;

    return {
        id:    'home',
        title: '<i class="fas fa-shapes text-soft-blue mr-2"></i> Matematikutforskaren',

        mount(parent) {
            root = document.createElement('section');
            root.id = 'view-home';
            root.className = 'flex-col h-full overflow-y-auto p-8';
            root.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    ${CARDS.map(c => `
                        <button data-tool-id="${c.id}"
                                class="bg-soft-surface p-8 rounded-2xl shadow-sm hover:shadow-md
                                       border border-soft-border flex flex-col items-center
                                       justify-center gap-4 transition-all hover:-translate-y-1">
                            <i class="fas ${c.icon} text-4xl text-${c.color}"></i>
                            <span class="font-bold text-soft-text">${c.label}</span>
                        </button>
                    `).join('')}
                </div>`;
            root.addEventListener('click', evt => {
                const card = evt.target.closest('[data-tool-id]');
                if (card) appState.activate(card.dataset.toolId);
            });
            parent.appendChild(root);
            return root;
        },
    };
}
