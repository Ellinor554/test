// ═══════════════════════════════════════════════════════════════════════════
// modules/tools/StatisticsEngine.js
// Pure model for the Statistik tool with localStorage persistence.
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = Object.freeze({
    data:    'matutf_statdata',
    type:    'matutf_charttype',
    title:   'matutf_charttitle',
    options: 'matutf_statoptions',
});

const VALID_TYPES = Object.freeze(['bar', 'line', 'pie']);

const DEFAULT_DATA = Object.freeze([
    { label: 'Äpplen',    value: 8 },
    { label: 'Bananer',   value: 5 },
    { label: 'Päron',     value: 3 },
    { label: 'Apelsiner', value: 7 },
    { label: 'Druvor',    value: 6 },
]);

const DEFAULT_OPTIONS = Object.freeze({
    showValues:   true,
    showGrid:     true,
    showCount:    false,
    showPercent:  true,
    showFraction: false,
});

const MIN_ROWS = 2;
const MAX_ROWS = 8;
const MAX_VALUE = 100;

export const CHART_COLORS = Object.freeze([
    '#5b80a5', '#a85c72', '#4f7c75', '#dec894',
    '#938db3', '#d58b99', '#8bb39c', '#8db1d1',
]);

export class StatisticsEngine {
    #chartType = 'bar';
    #title     = 'Mitt diagram';
    #data;
    #options;
    #listeners = new Set();

    constructor() {
        this.#data    = DEFAULT_DATA.map(d => ({ ...d }));
        this.#options = { ...DEFAULT_OPTIONS };
        this.#load();
    }

    setChartType(type) {
        if (!VALID_TYPES.includes(type)) {
            throw new Error(`Unknown chart type: "${type}"`);
        }
        if (type === this.#chartType) return;
        this.#chartType = type;
        this.#save();
        this.#emit();
    }

    setTitle(title) {
        const next = String(title ?? '');
        if (next === this.#title) return;
        this.#title = next;
        this.#save();
        this.#emit();
    }

    setRowLabel(index, label) {
        if (index < 0 || index >= this.#data.length) return;
        this.#data[index] = { ...this.#data[index], label: String(label ?? '') };
        this.#save();
        this.#emit();
    }

    setRowValue(index, value) {
        if (index < 0 || index >= this.#data.length) return;
        const clamped = Math.max(0, Math.min(MAX_VALUE, Math.round(Number(value) || 0)));
        if (this.#data[index].value === clamped) return;
        this.#data[index] = { ...this.#data[index], value: clamped };
        this.#save();
        this.#emit();
    }

    addRow() {
        if (this.#data.length >= MAX_ROWS) return;
        const idx = this.#data.length + 1;
        this.#data.push({
            label: `Kategori ${idx}`,
            value: Math.floor(Math.random() * 8) + 2,
        });
        this.#save();
        this.#emit();
    }

    removeLastRow() {
        if (this.#data.length <= MIN_ROWS) return;
        this.#data.pop();
        this.#save();
        this.#emit();
    }

    setOption(name, value) {
        if (!(name in this.#options)) {
            throw new Error(`Unknown option: "${name}"`);
        }
        const v = !!value;
        if (this.#options[name] === v) return;
        this.#options = { ...this.#options, [name]: v };
        this.#save();
        this.#emit();
    }

    getReading() {
        const data = this.#data.map((d, i) => ({
            label: d.label,
            value: d.value,
            color: CHART_COLORS[i % CHART_COLORS.length],
        }));
        const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0);
        const maxVal = Math.max(...data.map(d => d.value), 1);
        return Object.freeze({
            chartType: this.#chartType,
            title:     this.#title,
            data:      Object.freeze(data),
            options:   Object.freeze({ ...this.#options }),
            total,
            maxVal,
            isBar:  this.#chartType === 'bar',
            isLine: this.#chartType === 'line',
            isPie:  this.#chartType === 'pie',
            limits: Object.freeze({ MIN_ROWS, MAX_ROWS, MAX_VALUE }),
        });
    }

    static gcd(a, b) {
        a = Math.abs(Math.round(a));
        b = Math.abs(Math.round(b));
        while (b) { const t = b; b = a % b; a = t; }
        return a || 1;
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
            catch (err) { console.error('[StatisticsEngine] listener threw:', err); }
        }
    }

    #save() {
        try {
            localStorage.setItem(STORAGE_KEYS.data,    JSON.stringify(this.#data));
            localStorage.setItem(STORAGE_KEYS.type,    this.#chartType);
            localStorage.setItem(STORAGE_KEYS.title,   this.#title);
            localStorage.setItem(STORAGE_KEYS.options, JSON.stringify(this.#options));
        } catch (err) {
            console.warn('[StatisticsEngine] save failed:', err);
        }
    }

    #load() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEYS.data);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (Array.isArray(parsed) && parsed.length >= MIN_ROWS) {
                    this.#data = parsed.slice(0, MAX_ROWS).map(d => ({
                        label: String(d.label ?? ''),
                        value: Math.max(0, Math.min(MAX_VALUE, Math.round(Number(d.value) || 0))),
                    }));
                }
            }
            const savedType = localStorage.getItem(STORAGE_KEYS.type);
            if (savedType && VALID_TYPES.includes(savedType)) this.#chartType = savedType;

            const savedTitle = localStorage.getItem(STORAGE_KEYS.title);
            if (savedTitle !== null) this.#title = savedTitle;

            const savedOptions = localStorage.getItem(STORAGE_KEYS.options);
            if (savedOptions) {
                const parsed = JSON.parse(savedOptions);
                this.#options = { ...DEFAULT_OPTIONS, ...parsed };
            }
        } catch (err) {
            console.warn('[StatisticsEngine] load failed:', err);
        }
    }
}
