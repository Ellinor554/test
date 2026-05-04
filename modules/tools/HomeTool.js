import { appState } from '../core/AppState.js';

// All 11 tool cards from the original app, in their original order.
// `enabled: false` means the card is shown but disabled (greyed out) until
// that tool has been migrated. Flip to `true` after registering the tool
// in main.js.
const CARDS = [
    { id: 'fractions',       enabled: false, icon: 'fa-chart-pie',         bg: 'bg-soft-pinkLight/30',   fg: 'text-soft-pink',       title: 'Bråk',              desc: 'Jämför delar och bygg hela med flyttbara bråkcirklar.' },
    { id: 'numberlines',     enabled: true, icon: 'fa-ruler-horizontal',  bg: 'bg-soft-blueLight/30',   fg: 'text-soft-blue',       title: 'Tallinjer',         desc: 'Hoppa längs linjer från 0-10, 0-100 och utforska decimaltal.' },
    { id: 'geometry',        enabled: false, icon: 'fa-cubes',             bg: 'bg-soft-greenLight/30',  fg: 'text-soft-green',      title: 'Geometriska objekt', desc: 'Vrid och vänd på 2D- och 3D-former för att förstå deras egenskaper.' },
    { id: 'counting',        enabled: true, icon: 'fa-calculator',        bg: 'bg-soft-yellow/40',      fg: 'text-soft-yellowDark', title: 'Räkning',           desc: 'Hitta tiokompisarna och öva med multiplikations- och divisionskvadrater.' },
    { id: 'clock',           enabled: true, icon: 'fa-clock',             bg: 'bg-soft-purpleLight/30', fg: 'text-soft-purple',     title: 'Klockan',           desc: 'Dra i visarna för att jämföra analog och digital tid.' },
    { id: 'statistics',      enabled: false, icon: 'fa-chart-bar',         bg: 'bg-soft-tealLight/30',   fg: 'text-soft-teal',       title: 'Statistik',         desc: 'Bygg stapeldiagram, linjediagram och cirkeldiagram med egna värden.' },
    { id: 'koordinat',       enabled: false, icon: 'fa-crosshairs',        bg: 'bg-soft-purpleLight/30', fg: 'text-soft-purple',     title: 'Koordinatsystem',   desc: 'Rita punkter i ett koordinatplan och utforska x- och y-axeln.' },
    { id: 'positionssystem', enabled: false, icon: 'fa-cubes',             bg: 'bg-soft-blueLight/30',   fg: 'text-soft-blue',       title: 'Positionssystemet', desc: 'Bygg och utforska tal med tiobasmaterial – ental, tiotal, hundratal och tusental.' },
    { id: 'volym',           enabled: true,  icon: 'fa-fill-drip',         bg: 'bg-soft-blueLight/30',   fg: 'text-soft-blue',       title: 'Volym',             desc: 'Visualisera volymer och enhetsomvandlingar med Liter, Deciliter, Centiliter och Milliliter.' },
    { id: 'decimaltal',      enabled: false, icon: 'fa-arrows-left-right', bg: 'bg-soft-tealLight/30',   fg: 'text-soft-teal',       title: 'Decimaltal',        desc: 'Utforska positionsvärde och flytta siffror vid multiplikation och division med 10.' },
    { id: 'scale',           enabled: false, icon: 'fa-ruler-combined',    bg: 'bg-soft-blueLight/30',   fg: 'text-soft-blue',       title: 'Skala och mått',    desc: 'Utforska förstoring och förminskning med skalor och jämför verklighet med ritning.' },
];

function cardHTML(card) {
    const interactive = card.enabled
        ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer'
        : 'opacity-40 cursor-not-allowed';
    const iconHover = card.enabled ? 'group-hover:scale-110' : '';
    return `
        <button data-tool-id="${card.id}"
                ${card.enabled ? '' : 'disabled aria-disabled="true"'}
                class="bg-soft-surface p-8 rounded-2xl shadow-sm border border-soft-border
                       flex flex-col items-center justify-center gap-4 transition-all group
                       ${interactive}">
            <div class="w-20 h-20 rounded-full ${card.bg} ${card.fg} flex items-center
                        justify-center text-3xl ${iconHover} transition-transform">
                <i class="fas ${card.icon}"></i>
            </div>
            <h3 class="text-xl font-bold text-soft-text">${card.title}</h3>
            <p class="text-soft-muted text-center text-sm">${card.desc}</p>
        </button>`;
}

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
                <div class="max-w-5xl mx-auto w-full">
                    <h2 class="text-3xl font-bold text-soft-text mb-8 text-center">
                        Vad vill du utforska idag?
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${CARDS.map(cardHTML).join('')}
                    </div>
                </div>`;

            root.addEventListener('click', evt => {
                const card = evt.target.closest('[data-tool-id]');
                if (!card || card.disabled) return;
                appState.activate(card.dataset.toolId);
            });

            parent.appendChild(root);
            return root;
        },
    };
}
