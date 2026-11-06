import interactions from './parts/interactions.js';
import view from './parts/view.js';
import layout from './parts/layout.js';
import curves from './parts/curves.js';
import connections from './parts/connections.js';
import arrows from './parts/arrows.js';
import reroute from './parts/reroute.js';
import nodes from './parts/nodes.js';
import data from './parts/data.js';
import selection from './parts/selection.js';
import labels from './parts/labels.js';
import history from './parts/history.js';
import preview from './parts/preview.js';

export default class Drawflow {
  constructor(container, render = null, parent = null) {
    this.events = {};
    this.container = container;
    this.precanvas = null;
    this.nodeId = 1;
    this.ele_selected = null;
    this.node_selected = null;
    this.drag = false;
    this.reroute = false;
    this.reroute_fix_curvature = false;
    this.curvature = 0.5;
    // Connection to a node behind the output (left; above in vertical) drawn as a loop around the nodes
    this.curvature_backward = false;
    this.backward_offset = 60;
    this.backward_depth = 80;
    this.backward_row_gap = 120;
    this.reroute_curvature_start_end = 0.5;
    this.reroute_curvature = 0.5;
    this.reroute_width = 6;
    this.drag_point = false;
    this.editor_selected = false;
    this.connection = false;
    this.connection_ele = null;
    this.connection_selected = null;
    this.canvas_x = 0;
    this.canvas_y = 0;
    this.pos_x = 0;
    this.pos_x_start = 0;
    this.pos_y = 0;
    this.pos_y_start = 0;
    this.mouse_x = 0;
    this.mouse_y = 0;
    this.line_path = 5;
    this.first_click = null;
    this.force_first_input = false;
    this.draggable_inputs = true;
    this.useuuid = false;
    this.parent = parent;
    // Optional: function({ output_id, input_id, output_class, input_class }) => boolean.
    // Returning false blocks the connection (mouse or addConnection).
    this.connection_validator = null;
    // Arrows on connections: 'none', 'end' (into the input), 'start' (into the output) or 'both'
    this.connection_arrow = 'none';
    this.connection_arrow_size = 14;
    // Distance from the port center to the arrow tip (default port: 20px + 2px border)
    this.connection_arrow_offset = 12;
    // 'horizontal': outputs on the right, inputs on the left. 'vertical': inputs on top, outputs at the bottom
    this.connection_direction = 'horizontal';
    // Class added to the node under the pointer while dragging a connection, when dropping there connects
    this.connection_target_class = 'connection-target';
    this.connection_target = null;
    this.arrow_marker_id = 'drawflow-arrow-' + Math.random().toString(36).slice(2, 10);
    // Redraw connections when a node changes size (content loaded later, fonts, hidden tab)
    this.observe_node_resize = true;
    this.resize_observer = null;
    // Optional: function(id) / function({ output_id, input_id, output_class, input_class }) => boolean.
    // Returning false keeps the node or the connection (Delete key, ✕ button and the remove methods)
    this.node_remove_validator = null;
    this.connection_remove_validator = null;
    // Grid size for dragged nodes (0: no grid), and limits { min_x, min_y, max_x, max_y } (any of them)
    this.snap_grid = 0;
    this.node_bounds = null;
    // Ctrl/Shift + click and Shift + drag on the canvas select several nodes
    this.multiselect = false;
    this.selected_nodes = [];
    this.selection_box = null;
    this.drag_origin = {};
    // Undo and redo (Ctrl+Z, Ctrl+Y). Set before start()
    this.history = false;
    this.history_limit = 50;
    this.history_stack = [];
    this.history_index = -1;
    this.history_timer = null;
    this.history_restoring = false;

    this.noderegister = {};
    this.render = render;
    this.drawflow = { "drawflow": { "Home": { "data": {} }}};
    // Configurable options
    this.module = 'Home';
    this.editor_mode = 'edit';
    this.zoom = 1;
    this.zoom_max = 1.6;
    this.zoom_min = 0.5;
    this.zoom_value = 0.1;
    this.zoom_last_value = 1;
    this.zoom_use_ctrl_key = true;

    // Mobile
    this.evCache = new Array();
    this.prevDiff = -1;
  }

  start () {
    if(this.precanvas) {
      // Already started: binding events again would fire every event twice
      return;
    }
    this.container.classList.add("parent-drawflow");
    this.container.tabIndex = 0;
    this.precanvas = document.createElement('div');
    this.precanvas.classList.add("drawflow");
    this.container.appendChild(this.precanvas);
    this.createArrowMarkers();
    this.container.classList.toggle("drawflow-vertical", this.connection_direction === 'vertical');

    /* Mouse and Touch Actions */
    this.container.addEventListener('mouseup', this.dragEnd.bind(this));
    this.container.addEventListener('mousemove', this.position.bind(this));
    this.container.addEventListener('mousedown', this.click.bind(this) );

    this.container.addEventListener('touchend', this.dragEnd.bind(this));
    this.container.addEventListener('touchmove', this.position.bind(this));
    this.container.addEventListener('touchstart', this.click.bind(this));

    /* Context Menu */
    this.container.addEventListener('contextmenu', this.contextmenu.bind(this));
    /* Delete */
    this.container.addEventListener('keydown', this.key.bind(this));

    /* Zoom Mouse */
    this.container.addEventListener('wheel', this.zoom_enter.bind(this));
    /* Update data Nodes */
    this.container.addEventListener('input', this.updateNodeValue.bind(this));

    this.container.addEventListener('dblclick', this.dblclick.bind(this));
    /* Keep dragging when the pointer leaves the container, and release it outside */
    this.window_mousemove = e => {
      if(!this.container.contains(e.target) && (this.drag || this.drag_point || this.editor_selected || this.connection || this.selection_box)) {
        this.position(e);
      }
    };
    this.window_mouseup = e => {
      if(!this.container.contains(e.target) && (this.drag || this.drag_point || this.editor_selected || this.connection || this.selection_box)) {
        this.dragEnd(e);
      }
    };
    window.addEventListener('mousemove', this.window_mousemove);
    window.addEventListener('mouseup', this.window_mouseup);
    if(this.observe_node_resize && typeof ResizeObserver !== 'undefined') {
      this.resize_observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          if(entry.target.isConnected) {
            this.updateConnectionNodes(entry.target.id);
          }
        });
      });
    }
    /* Mobile zoom */
    this.container.onpointerdown = this.pointerdown_handler.bind(this);
    this.container.onpointermove = this.pointermove_handler.bind(this);
    this.container.onpointerup = this.pointerup_handler.bind(this);
    this.container.onpointercancel = this.pointerup_handler.bind(this);
    this.container.onpointerout = this.pointerup_handler.bind(this);
    this.container.onpointerleave = this.pointerup_handler.bind(this);

    this.load();
    if(this.history) {
      this.startHistory();
    }
  }

  /* End Mobile Zoom */
  load() {
    for (var key in this.drawflow.drawflow[this.module].data) {
      this.addNodeImport(this.drawflow.drawflow[this.module].data[key], this.precanvas);
    }

    if(this.reroute) {
      for (var key in this.drawflow.drawflow[this.module].data) {
        this.addRerouteImport(this.drawflow.drawflow[this.module].data[key]);
      }
    }

    for (var key in this.drawflow.drawflow[this.module].data) {
      this.updateConnectionNodes('node-'+key);
    }

    const editor = this.drawflow.drawflow;
    let number = 1;
    Object.keys(editor).map(function(moduleName, index) {
      Object.keys(editor[moduleName].data).map(function(id, index2) {
        if(parseInt(id) >= number) {
          number = parseInt(id)+1;
        }
      });
    });
    this.nodeId = number;
  }

  /* Events */
  on (event, callback) {
       // Check if the callback is not a function
       if (typeof callback !== 'function') {
           console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
           return false;
       }
       // Check if the event is not a string
       if (typeof event !== 'string') {
           console.error(`The event name must be a string, the given type is ${typeof event}`);
           return false;
       }
       // Check if this event not exists
       if (this.events[event] === undefined) {
           this.events[event] = {
               listeners: []
           }
       }
       this.events[event].listeners.push(callback);
   }

   removeListener (event, callback) {
      // Check if this event not exists

      if (!this.events[event]) return false

      const listeners = this.events[event].listeners
      const listenerIndex = listeners.indexOf(callback)
      const hasListener = listenerIndex > -1
      if (hasListener) listeners.splice(listenerIndex, 1)
   }

   dispatch (event, details) {
       // Check if this event not exists
       if (this.events[event] === undefined) {
           // console.error(`This event: ${event} does not exist`);
           return false;
       }
       this.events[event].listeners.forEach((listener) => {
           listener(details);
       });
   }

    getUuid() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }

  // Methods accept the node id as 5, '5' or 'node-5'
  nodeKey(id) {
    return String(id).replace(/^node-/, '');
  }

  nodeElementId(id) {
    return 'node-' + this.nodeKey(id);
  }

  // Kind of element by its classes, not only the first one: the container may have classes of its own
  elementType(ele) {
    const types = ['drawflow-node', 'output', 'parent-drawflow', 'drawflow', 'main-path', 'point', 'drawflow-delete'];
    return types.find(type => ele.classList.contains(type)) || ele.classList[0];
  }
}

// Each file in parts/ adds its methods to the class, not enumerable like the ones written above
[interactions, view, layout, curves, connections, arrows, reroute, nodes, data, selection, labels, history, preview].forEach(methods => {
  Object.keys(methods).forEach(name => {
    Object.defineProperty(Drawflow.prototype, name, { value: methods[name], writable: true, configurable: true });
  });
});
