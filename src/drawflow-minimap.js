// Optional minimap: load dist/drawflow-minimap.min.js after Drawflow and call new DrawflowMinimap(editor)
const REDRAW = ['nodeCreated', 'nodeRemoved', 'nodeMoved', 'connectionCreated', 'connectionRemoved', 'import', 'moduleChanged', 'zoom', 'translate'];

export default class DrawflowMinimap {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.width = options.width || 200;
    this.height = options.height || 140;
    this.bounds = null;
    this.element = document.createElement('div');
    this.element.classList.add('drawflow-minimap');
    this.element.style.width = this.width + 'px';
    this.element.style.height = this.height + 'px';
    this.flow = document.createElement('div');
    this.flow.classList.add('drawflow-minimap-flow');
    this.view = document.createElement('div');
    this.view.classList.add('drawflow-minimap-view');
    this.element.appendChild(this.flow);
    this.element.appendChild(this.view);
    editor.container.appendChild(this.element);
    if(getComputedStyle(editor.container).position === 'static') {
      editor.container.style.position = 'relative';
    }

    this.redraw = () => {
      if(!this.frame) {
        this.frame = requestAnimationFrame(() => { this.frame = null; this.refresh(); });
      }
    };
    this.onMouseMove = () => {
      if(editor.drag || editor.editor_selected) {
        this.redraw();
      }
    };
    REDRAW.forEach(name => editor.on(name, this.redraw));
    editor.on('mouseMove', this.onMouseMove);

    // The editor must not see these events as clicks on its canvas
    ['mousedown', 'touchstart', 'dblclick', 'contextmenu', 'wheel'].forEach(name => this.element.addEventListener(name, e => e.stopPropagation()));
    const move = e => {
      const rect = this.element.getBoundingClientRect();
      this.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
    };
    this.element.addEventListener('mousedown', e => {
      move(e);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);
    });
    this.refresh();
  }

  // Scale and offset of the picture, which is centered in the minimap
  layout() {
    const bounds = this.bounds;
    const scale = Math.min(this.width / bounds.width, this.height / bounds.height);
    return { scale: scale, x: (this.width - bounds.width * scale) / 2, y: (this.height - bounds.height * scale) / 2 };
  }

  moveTo(x, y) {
    if(this.bounds) {
      const layout = this.layout();
      this.editor.centerCanvasOn(this.bounds.x + (x - layout.x) / layout.scale, this.bounds.y + (y - layout.y) / layout.scale);
      this.refresh();
    }
  }

  refresh() {
    const editor = this.editor;
    const preview = editor.renderPreview(this.flow, { padding: 20 });
    this.bounds = preview ? preview.bounds : null;
    this.view.style.display = preview ? 'block' : 'none';
    if(!preview) {
      return;
    }
    const layout = this.layout();
    const canvas = editor.precanvas.getBoundingClientRect();
    const visible = editor.container.getBoundingClientRect();
    this.view.style.left = layout.x + ((visible.left - canvas.left) / editor.zoom - this.bounds.x) * layout.scale + 'px';
    this.view.style.top = layout.y + ((visible.top - canvas.top) / editor.zoom - this.bounds.y) * layout.scale + 'px';
    this.view.style.width = visible.width / editor.zoom * layout.scale + 'px';
    this.view.style.height = visible.height / editor.zoom * layout.scale + 'px';
  }

  destroy() {
    REDRAW.forEach(name => this.editor.removeListener(name, this.redraw));
    this.editor.removeListener('mouseMove', this.onMouseMove);
    this.element.remove();
  }
}
