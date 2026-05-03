import { ToolRegistry }     from './core/ToolRegistry.js';
import { createHomeTool }   from './tools/HomeTool.js';
import { createVolumeTool } from './tools/VolumeTool.js';
import { createClockTool }  from './tools/ClockTool.js';

const registry = new ToolRegistry({
    mountEl:      document.getElementById('tool-mount'),
    titleEl:      document.getElementById('app-title'),
    homeBtn:      document.getElementById('btn-home'),
    controlsArea: document.getElementById('controls-area'),
});

registry.register(createHomeTool());
registry.register(createVolumeTool());
registry.register(createClockTool());

registry.mountActive();

window.__app = { registry };
