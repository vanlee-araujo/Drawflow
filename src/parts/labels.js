// Text on connections. The label is an element of the canvas, not of the connection svg: the
// reroute code indexes the children of the svg. The text is saved on the output side of the data.
export default {
  connectionData(id_output, id_input, output_class, input_class) {
    const moduleName = this.getModuleFromNodeId(id_output);
    const node = moduleName && this.drawflow.drawflow[moduleName].data[this.nodeKey(id_output)];
    if(!node || !node.outputs[output_class]) {
      return undefined;
    }
    return node.outputs[output_class].connections.find(item => String(item.node) === this.nodeKey(id_input) && item.output === input_class);
  },

  setConnectionLabel(id_output, id_input, output_class, input_class, text) {
    const connection = this.connectionData(id_output, id_input, output_class, input_class);
    if(!connection) {
      return false;
    }
    if(text === undefined || text === null || text === '') {
      delete connection.label;
    } else {
      connection.label = String(text);
    }
    const ele = this.container.querySelector('.connection.node_in_' + this.nodeElementId(id_input) + '.node_out_' + this.nodeElementId(id_output) + '.' + output_class + '.' + input_class);
    if(ele) {
      this.updateConnectionLabel(ele);
    }
    this.dispatch('connectionLabelChanged', { output_id: this.nodeKey(id_output), input_id: this.nodeKey(id_input), output_class: output_class, input_class: input_class, label: connection.label || '' });
    return true;
  },

  getConnectionLabel(id_output, id_input, output_class, input_class) {
    const connection = this.connectionData(id_output, id_input, output_class, input_class);
    return connection && connection.label ? connection.label : '';
  },

  updateConnectionLabel(ele) {
    const list = ele.classList;
    const connection = this.connectionData(list[2].slice(14), list[1].slice(13), list[3], list[4]);
    const text = connection && connection.label;
    let label = Array.from(this.precanvas.children).find(item => item.drawflowConnection === ele);
    if(!text) {
      if(label) {
        label.remove();
      }
      return;
    }
    if(!label) {
      label = document.createElement('div');
      label.classList.add('connection-label');
      label.drawflowConnection = ele;
      this.precanvas.appendChild(label);
    }
    label.textContent = text;
    // Middle of the line; with reroute_fix_curvature, of its middle segment
    const paths = ele.querySelectorAll('.main-path');
    const path = paths[Math.floor((paths.length - 1) / 2)];
    const point = path.getPointAtLength(path.getTotalLength() / 2);
    label.style.left = point.x + 'px';
    label.style.top = point.y + 'px';
  },

  removeOrphanLabels() {
    this.precanvas.querySelectorAll('.connection-label').forEach(label => {
      if(!label.drawflowConnection.isConnected) {
        label.remove();
      }
    });
  },
};
