import { ToolRegistry }          from './core/ToolRegistry.js';
import { createHomeTool }        from './tools/HomeTool.js';
import { createVolumeTool }      from './tools/VolumeTool.js';
import { createClockTool }       from './tools/ClockTool.js';
import { createNumberLineTool }  from './tools/NumberLineTool.js';
import { createCountingTool }    from './tools/CountingTool.js';

const registry = new ToolRegistry({
    mountEl:      document.getElementById('tool-mount'),
    titleEl:      document.getElementById('app-title'),
    homeBtn:      document.getElementById('btn-home'),
    controlsArea: document.getElementById('controls-area'),
});

registry.register(createHomeTool());
registry.register(createVolumeTool());
registry.register(createClockTool());
registry.register(createNumberLineTool());
registry.register(createCountingTool());

registry.mountActive();

window.__app = { registry };
