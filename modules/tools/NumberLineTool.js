import { NumberLineEngine } from './NumberLineEngine.js';
import { NumberLineView }   from './NumberLineView.js';

export function createNumberLineTool() {
    const engine = new NumberLineEngine();
    const view   = new NumberLineView(engine);

    return {
        id:    'numberlines',
        title: '<i class="fas fa-ruler-horizontal text-soft-blue mr-2"></i>Tallinjer',

        mount(parent) { return view.mount(parent); },
        onEnter()     { view.onEnter(); },
        onLeave()     { view.onLeave(); },

        _engine: engine,
        _view:   view,
    };
}
