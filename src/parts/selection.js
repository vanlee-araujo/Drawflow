// Selecting and dragging nodes
export default {
  isTyping(ele) {
    return ele != null && (ele.tagName === 'INPUT' || ele.tagName === 'TEXTAREA' || ele.tagName === 'SELECT' || ele.hasAttribute('contenteditable'));
  },

  selectNode(id) {
    const node = this.container.querySelector('#' + this.nodeElementId(id));
    if(!node) {
      return false;
    }
    this.clearSelection();
    this.node_selected = node;
    this.first_click = node;
    node.classList.add('selected');
    this.dispatch('nodeSelected', this.nodeKey(id));
    return true;
  },

  clearSelection() {
    this.selected_nodes.forEach(id => {
      const node = this.container.querySelector('#node-' + id);
      if(node) {
        node.classList.remove('multiselected');
      }
    });
    this.selected_nodes = [];
    if(this.node_selected != null) {
      this.node_selected.classList.remove('selected');
      this.node_selected = null;
      this.dispatch('nodeUnselected', true);
    }
    if(this.connection_selected != null) {
      this.connection_selected.classList.remove('selected');
      this.removeReouteConnectionSelected();
      this.connection_selected = null;
      this.dispatch('connectionUnselected', true);
    }
  },

  selectNodes(ids) {
    this.clearSelection();
    ids.forEach(id => {
      id = this.nodeKey(id);
      const node = this.container.querySelector('#node-' + id);
      if(node) {
        this.selected_nodes.push(id);
        node.classList.add('multiselected');
      }
    });
    this.dispatch('selectionChanged', this.selected_nodes.slice());
  },

  getSelectedNodes() {
    if(this.selected_nodes.length > 0) {
      return this.selected_nodes.slice();
    }
    return this.node_selected ? [this.node_selected.id.slice(5)] : [];
  },

  // A plain click keeps the selection when it is on a selected node, so the group can be dragged
  updateMultiSelection(id, additive) {
    if(additive) {
      const ids = this.getSelectedNodes();
      const index = ids.indexOf(id);
      if(index > -1) {
        ids.splice(index, 1);
      } else {
        ids.push(id);
      }
      this.selectNodes(ids);
      return true;
    }
    if(this.selected_nodes.length > 0 && !this.selected_nodes.includes(id)) {
      this.selectNodes([]);
    }
    return false;
  },

  nodesToDrag() {
    const id = this.ele_selected.id.slice(5);
    if(this.selected_nodes.includes(id)) {
      return this.selected_nodes.filter(item => !this.isNodeLocked(item));
    }
    return [id];
  },

  constrainPosition(x, y) {
    if(this.snap_grid > 0) {
      x = Math.round(x / this.snap_grid) * this.snap_grid;
      y = Math.round(y / this.snap_grid) * this.snap_grid;
    }
    const bounds = this.node_bounds;
    if(bounds) {
      if(bounds.min_x !== undefined) { x = Math.max(bounds.min_x, x); }
      if(bounds.min_y !== undefined) { y = Math.max(bounds.min_y, y); }
      if(bounds.max_x !== undefined) { x = Math.min(bounds.max_x, x); }
      if(bounds.max_y !== undefined) { y = Math.min(bounds.max_y, y); }
    }
    return { x: x, y: y };
  },

  // Positions are kept unconstrained while dragging, so the grid does not swallow small moves
  dragNodes(x, y) {
    this.nodesToDrag().forEach(id => {
      const node = this.container.querySelector('#node-' + id);
      const origin = this.drag_origin[id] || (this.drag_origin[id] = { x: node.offsetLeft, y: node.offsetTop });
      origin.x -= x;
      origin.y -= y;
      const position = this.constrainPosition(origin.x, origin.y);
      node.style.left = position.x + 'px';
      node.style.top = position.y + 'px';
      const data = this.drawflow.drawflow[this.module].data[id];
      data.pos_x = position.x;
      data.pos_y = position.y;
      this.updateConnectionNodes('node-' + id);
    });
  },

  startSelectionBox(x, y) {
    const box = document.createElement('div');
    box.classList.add('drawflow-selection-box');
    this.container.appendChild(box);
    this.selection_box = { element: box, x: x, y: y, end_x: x, end_y: y };
    this.updateSelectionBox(x, y);
  },

  updateSelectionBox(x, y) {
    const selection = this.selection_box;
    const rect = this.container.getBoundingClientRect();
    selection.end_x = x;
    selection.end_y = y;
    selection.element.style.left = Math.min(selection.x, x) - rect.left + 'px';
    selection.element.style.top = Math.min(selection.y, y) - rect.top + 'px';
    selection.element.style.width = Math.abs(x - selection.x) + 'px';
    selection.element.style.height = Math.abs(y - selection.y) + 'px';
  },

  finishSelectionBox() {
    const box = this.selection_box.element.getBoundingClientRect();
    const ids = Array.from(this.precanvas.querySelectorAll('.drawflow-node')).filter(node => {
      const rect = node.getBoundingClientRect();
      return rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top;
    }).map(node => node.id.slice(5));
    this.selection_box.element.remove();
    this.selection_box = null;
    this.selectNodes(ids);
  },
};
