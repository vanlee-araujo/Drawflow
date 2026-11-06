// Modules, import and export
export default {
  getModuleFromNodeId(id) {
    id = this.nodeKey(id);
    var nameModule;
    const editor = this.drawflow.drawflow
    Object.keys(editor).map(function(moduleName, index) {
      Object.keys(editor[moduleName].data).map(function(node, index2) {
        if(node == id) {
          nameModule = moduleName;
        }
      })
    });
    return nameModule;
  },

  addModule(name) {
    this.drawflow.drawflow[name] =  { "data": {} };
    this.dispatch('moduleCreated', name);
  },

  changeModule(name) {
    this.dispatch('moduleChanging', name);
    this.module = name;
    this.precanvas.innerHTML = "";
    this.canvas_x = 0;
    this.canvas_y = 0;
    this.pos_x = 0;
    this.pos_y = 0;
    this.mouse_x = 0;
    this.mouse_y = 0;
    this.zoom = 1;
    this.zoom_last_value = 1;
    this.precanvas.style.transform = '';
    this.import(this.drawflow, false);
    this.dispatch('moduleChanged', name);
  },

  removeModule(name) {
    delete this.drawflow.drawflow[name];
    if(this.module === name) {
      // Removing the module on screen: show another one (or an empty 'Home')
      const modules = Object.keys(this.drawflow.drawflow);
      if(modules.length === 0) {
        this.drawflow.drawflow['Home'] = { "data": {} };
      }
      this.changeModule(modules.length > 0 ? modules[0] : 'Home');
    }
    this.dispatch('moduleRemoved', name);
  },

  clearModuleSelected() {
    if(this.resize_observer) {
      this.resize_observer.disconnect();
    }
    this.precanvas.innerHTML = "";
    this.drawflow.drawflow[this.module] =  { "data": {} };
  },

  clear () {
    if(this.resize_observer) {
      this.resize_observer.disconnect();
    }
    this.precanvas.innerHTML = "";
    this.drawflow = { "drawflow": { "Home": { "data": {} }}};
    this.module = 'Home';
  },

  export () {
    const dataExport = JSON.parse(JSON.stringify(this.drawflow));
    this.dispatch('export', dataExport);
    return dataExport;
  },

  import (data, notifi = true) {
    const module = this.module; // clear() goes back to 'Home'
    this.clear();
    this.module = module;
    this.drawflow = JSON.parse(JSON.stringify(data));
    this.repairConnections();
    if(this.drawflow.drawflow[this.module] === undefined) {
      // Data without the current module (ex. without 'Home'): show the first one
      const modules = Object.keys(this.drawflow.drawflow);
      if(modules.length > 0) {
        this.module = modules[0];
      } else {
        this.drawflow.drawflow[this.module] = { "data": {} };
      }
    }
    this.load();
    if(notifi) {
      this.dispatch('import', 'import');
    }
  },

  // Imported data: node ids as text, no duplicated connections, and every connection present on
  // both sides (output and input). The input side is the one drawn; reroute points live on the output side.
  repairConnections() {
    Object.keys(this.drawflow.drawflow).forEach(moduleName => {
      const data = this.drawflow.drawflow[moduleName].data || {};
      const valid = {};
      Object.keys(data).forEach(id => {
        Object.keys(data[id].inputs || {}).forEach(input_class => {
          const seen = {};
          data[id].inputs[input_class].connections = data[id].inputs[input_class].connections.filter(item => {
            const key = String(item.node) + ' ' + item.input;
            const source = data[item.node];
            if(seen[key] || source === undefined || source.outputs === undefined || source.outputs[item.input] === undefined) {
              return false;
            }
            seen[key] = true;
            item.node = String(item.node);
            valid[item.node + ' ' + item.input + ' ' + id + ' ' + input_class] = true;
            return true;
          });
        });
      });
      Object.keys(data).forEach(id => {
        Object.keys(data[id].outputs || {}).forEach(output_class => {
          const seen = {};
          data[id].outputs[output_class].connections = data[id].outputs[output_class].connections.filter(item => {
            const key = id + ' ' + output_class + ' ' + String(item.node) + ' ' + item.output;
            if(seen[key] || !valid[key]) {
              return false;
            }
            seen[key] = true;
            item.node = String(item.node);
            return true;
          });
        });
      });
      // Connections only listed on the input side
      Object.keys(data).forEach(id => {
        Object.keys(data[id].inputs || {}).forEach(input_class => {
          data[id].inputs[input_class].connections.forEach(item => {
            const outputs = data[item.node].outputs[item.input].connections;
            if(!outputs.some(out => out.node === String(id) && out.output === input_class)) {
              outputs.push({ "node": String(id), "output": input_class });
            }
          });
        });
      });
    });
  },
};
