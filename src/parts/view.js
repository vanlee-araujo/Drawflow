// Zoom, pan and fit
export default {
  zoom_enter(event, delta) {
    if (!this.zoom_use_ctrl_key || event.ctrlKey) {
      event.preventDefault()
      if(event.deltaY > 0) {
        // Zoom Out
        this.zoom_out();
      } else {
        // Zoom In
        this.zoom_in();
      }
    }
  },

  zoom_refresh(){
    this.dispatch('zoom', this.zoom);
    this.canvas_x = (this.canvas_x / this.zoom_last_value) * this.zoom;
    this.canvas_y = (this.canvas_y / this.zoom_last_value) * this.zoom;
    this.zoom_last_value = this.zoom;
    this.precanvas.style.transform = "translate("+this.canvas_x+"px, "+this.canvas_y+"px) scale("+this.zoom+")";
  },

  zoom_in() {
    if(this.zoom < this.zoom_max) {
      this.setZoom(this.zoom + this.zoom_value);
    }
  },

  zoom_out() {
    if(this.zoom > this.zoom_min) {
      this.setZoom(this.zoom - this.zoom_value);
    }
  },

  zoom_reset(){
    if(this.zoom != 1) {
      this.zoom = 1;
      this.zoom_refresh();
    }
  },

  setZoom(value) {
    // Rounded: 1.5 + 0.1 must not end up above zoom_max because of floating point
    this.zoom = Math.min(this.zoom_max, Math.max(this.zoom_min, Math.round(value * 1000) / 1000));
    this.zoom_refresh();
  },

  setCanvasPosition(x, y) {
    this.canvas_x = x;
    this.canvas_y = y;
    this.dispatch('translate', { x: x, y: y });
    this.precanvas.style.transform = "translate("+this.canvas_x+"px, "+this.canvas_y+"px) scale("+this.zoom+")";
  },

  // Zoom and pan so that every node (with its ports and connections) fits in the editor
  zoomFit(options = {}) {
    const padding = options.padding !== undefined ? options.padding : 20;
    const minZoom = options.minZoom !== undefined ? options.minZoom : this.zoom_min;
    const maxZoom = options.maxZoom !== undefined ? options.maxZoom : 1;
    const elements = this.precanvas.querySelectorAll('.drawflow-node, .drawflow-node .input, .drawflow-node .output, .connection .main-path, .connection .point');
    if(elements.length === 0 || this.container.clientWidth === 0 || this.container.clientHeight === 0) {
      return null;
    }
    // Bounds in canvas units: the canvas is drawn at canvas_x/y with scale zoom
    const canvasRect = this.precanvas.getBoundingClientRect();
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    elements.forEach(ele => {
      const rect = ele.getBoundingClientRect();
      if(rect.width === 0 && rect.height === 0) {
        return;
      }
      left = Math.min(left, (rect.left - canvasRect.left) / this.zoom);
      top = Math.min(top, (rect.top - canvasRect.top) / this.zoom);
      right = Math.max(right, (rect.right - canvasRect.left) / this.zoom);
      bottom = Math.max(bottom, (rect.bottom - canvasRect.top) / this.zoom);
    });
    if(left === Infinity) {
      return null;
    }
    const width = Math.max(1, this.container.clientWidth - 2 * padding);
    const height = Math.max(1, this.container.clientHeight - 2 * padding);
    let zoom = Math.min(width / Math.max(1, right - left), height / Math.max(1, bottom - top));
    zoom = Math.round(Math.min(maxZoom, Math.max(minZoom, zoom)) * 1000) / 1000;
    // translate(x, y) scale(zoom) around transform-origin (o): screen = o + translate + zoom * (point - o)
    this.zoom = zoom;
    this.zoom_last_value = zoom;
    this.dispatch('zoom', zoom);
    this.placeCanvasPoint(left, top, padding + (width - zoom * (right - left)) / 2, padding + (height - zoom * (bottom - top)) / 2);
    return { zoom: zoom, x: this.canvas_x, y: this.canvas_y };
  },

  // Pan so that a point of the canvas appears at a position of the container
  placeCanvasPoint(x, y, container_x, container_y) {
    const origin = getComputedStyle(this.precanvas).transformOrigin.split(' ').map(parseFloat);
    this.setCanvasPosition(
      container_x - this.precanvas.offsetLeft - origin[0] - this.zoom * (x - origin[0]),
      container_y - this.precanvas.offsetTop - origin[1] - this.zoom * (y - origin[1])
    );
  },

  centerCanvasOn(x, y) {
    this.placeCanvasPoint(x, y, this.container.clientWidth / 2, this.container.clientHeight / 2);
  },

  centerNode(id) {
    const node = this.container.querySelector('#' + this.nodeElementId(id));
    if(node) {
      const data = this.getNodeFromId(id);
      this.centerCanvasOn(data.pos_x + node.offsetWidth / 2, data.pos_y + node.offsetHeight / 2);
    }
  },
};
