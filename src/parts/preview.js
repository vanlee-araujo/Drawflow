// A small picture of a flow: boxes and lines, drawn from the data in any element. Used by the minimap
// and useful for a node that shows another flow
const SVG = 'http://www.w3.org/2000/svg';

export default {
  // options.data: an export(), a module ({ data }) or its nodes; options.module: a module of this editor
  previewNodes(options) {
    let source = options.data;
    if(source === undefined) {
      source = this.drawflow.drawflow[options.module || this.module];
    }
    if(source && source.drawflow) {
      source = source.drawflow[options.module || Object.keys(source.drawflow)[0]];
    }
    return (source && source.data) || source || {};
  },

  renderPreview(element, options = {}) {
    const nodes = this.previewNodes(options);
    const current = options.data === undefined && (options.module === undefined || options.module === this.module);
    const vertical = (options.direction || this.connection_direction) === 'vertical';
    const padding = options.padding !== undefined ? options.padding : 10;
    const boxes = {};
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    Object.keys(nodes).forEach(id => {
      const ele = current ? this.container.querySelector('#node-' + id) : null;
      const box = { x: nodes[id].pos_x, y: nodes[id].pos_y, width: ele ? ele.offsetWidth : (options.nodeWidth || 160), height: ele ? ele.offsetHeight : (options.nodeHeight || 70) };
      boxes[id] = box;
      left = Math.min(left, box.x);
      top = Math.min(top, box.y);
      right = Math.max(right, box.x + box.width);
      bottom = Math.max(bottom, box.y + box.height);
    });
    element.innerHTML = '';
    if(left === Infinity) {
      return null;
    }
    const bounds = { x: left - padding, y: top - padding, width: right - left + 2 * padding, height: bottom - top + 2 * padding };
    const svg = document.createElementNS(SVG, 'svg');
    svg.classList.add('drawflow-preview');
    svg.setAttributeNS(null, 'viewBox', [bounds.x, bounds.y, bounds.width, bounds.height].join(' '));
    svg.setAttributeNS(null, 'width', '100%');
    svg.setAttributeNS(null, 'height', '100%');
    Object.keys(nodes).forEach(id => {
      Object.values(nodes[id].outputs || {}).forEach(output => output.connections.forEach(connection => {
        const from = boxes[id], to = boxes[connection.node];
        if(!to) {
          return;
        }
        const start = vertical ? [from.x + from.width / 2, from.y + from.height] : [from.x + from.width, from.y + from.height / 2];
        const end = vertical ? [to.x + to.width / 2, to.y] : [to.x, to.y + to.height / 2];
        const middle = vertical ? [[start[0], (start[1] + end[1]) / 2], [end[0], (start[1] + end[1]) / 2]] : [[(start[0] + end[0]) / 2, start[1]], [(start[0] + end[0]) / 2, end[1]]];
        const line = document.createElementNS(SVG, 'path');
        line.classList.add('drawflow-preview-line');
        line.setAttributeNS(null, 'd', 'M ' + start.join(' ') + ' C ' + middle[0].join(' ') + ' ' + middle[1].join(' ') + ' ' + end.join(' '));
        svg.appendChild(line);
      }));
    });
    Object.keys(nodes).forEach(id => {
      const box = boxes[id];
      const rect = document.createElementNS(SVG, 'rect');
      rect.classList.add('drawflow-preview-node');
      if(typeof nodes[id].class === 'string') {
        rect.classList.add(...nodes[id].class.split(' ').filter(name => name !== ''));
      }
      rect.setAttributeNS(null, 'x', box.x);
      rect.setAttributeNS(null, 'y', box.y);
      rect.setAttributeNS(null, 'width', box.width);
      rect.setAttributeNS(null, 'height', box.height);
      rect.setAttributeNS(null, 'rx', 6);
      if(typeof options.color === 'function') {
        const color = options.color(nodes[id]);
        if(color) {
          rect.style.fill = color;
        }
      }
      svg.appendChild(rect);
    });
    element.appendChild(svg);
    return { svg: svg, bounds: bounds };
  },
};
