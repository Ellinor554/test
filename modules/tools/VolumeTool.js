import { VolumeEngine } from './VolumeEngine.js';
import { VolumeView }   from './VolumeView.js';

export function createVolumeTool() {
    const engine = new VolumeEngine();
    const view   = new VolumeView(engine);

    return {
        id:    'volym',
        title: '<i class="fas fa-flask text-soft-blue mr-2"></i>Volym',

        mount(parent) { return view.mount(parent); },
        onEnter()     { view.onEnter(); },
        onLeave()     { view.onLeave(); },

        _engine: engine,
        _view:   view,
    };
}
