import { ClockEngine } from './ClockEngine.js';
import { ClockView }   from './ClockView.js';

export function createClockTool() {
    const engine = new ClockEngine();
    const view   = new ClockView(engine);

    return {
        id:    'clock',
        title: '<i class="fas fa-clock text-soft-purple mr-2"></i>Klockan',

        mount(parent) { return view.mount(parent); },
        onEnter()     { view.onEnter(); },
        onLeave()     { view.onLeave(); },

        _engine: engine,
        _view:   view,
    };
}
