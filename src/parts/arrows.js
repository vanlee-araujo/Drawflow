// Arrows and direction of the connections
export default {
  createArrowMarkers() {
    var old = this.container.querySelector('.drawflow-markers');
    if(old) {
      old.remove();
    }
    const size = this.connection_arrow_size;
    const half = size / 2;
    const defsSvg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    defsSvg.classList.add("drawflow-markers");
    defsSvg.setAttributeNS(null, 'width', 0);
    defsSvg.setAttributeNS(null, 'height', 0);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', "defs");
    const marker = document.createElementNS('http://www.w3.org/2000/svg', "marker");
    marker.setAttributeNS(null, 'id', this.arrow_marker_id);
    marker.setAttributeNS(null, 'markerUnits', 'userSpaceOnUse');
    marker.setAttributeNS(null, 'markerWidth', size);
    marker.setAttributeNS(null, 'markerHeight', size);
    marker.setAttributeNS(null, 'viewBox', '0 0 '+ size +' '+ size);
    // The tip stays connection_arrow_offset before the end of the line, outside the port
    marker.setAttributeNS(null, 'refX', size + this.connection_arrow_offset);
    marker.setAttributeNS(null, 'refY', half);
    marker.setAttributeNS(null, 'orient', 'auto-start-reverse');
    marker.style.overflow = 'visible';
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', "path");
    arrow.classList.add("drawflow-arrow");
    arrow.setAttributeNS(null, 'd', 'M 0 0 L '+ size +' '+ half +' L 0 '+ size +' Z');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    defsSvg.appendChild(defs);
    this.container.appendChild(defsSvg);
  },

  updateConnectionArrows(connection) {
    // Paths always go from the output to the input: the first starts at the output, the last ends at the input
    const paths = connection.querySelectorAll('.main-path');
    const url = 'url(#'+ this.arrow_marker_id +')';
    const start = this.connection_arrow === 'start' || this.connection_arrow === 'both';
    const end = this.connection_arrow === 'end' || this.connection_arrow === 'both';
    let changed = false;
    const setMarker = (path, name, value) => {
      if(path.getAttribute(name) === value) {
        return;
      }
      changed = true;
      if(value === null) {
        path.removeAttributeNS(null, name);
      } else {
        path.setAttributeNS(null, name, value);
      }
    };
    paths.forEach((path, i) => {
      setMarker(path, 'marker-start', start && i === 0 ? url : null);
      setMarker(path, 'marker-end', end && i === paths.length - 1 ? url : null);
    });
    // WebKit only resolves markers when the element enters the document: reinsert it in place
    if(changed && connection.parentNode) {
      connection.parentNode.insertBefore(connection, connection.nextSibling);
    }
  },

  setConnectionArrow(arrow, size = this.connection_arrow_size, offset = this.connection_arrow_offset) {
    this.connection_arrow = arrow;
    this.connection_arrow_size = size;
    this.connection_arrow_offset = offset;
    if(this.precanvas) {
      this.createArrowMarkers();
      this.container.querySelectorAll('.connection').forEach(ele => this.updateConnectionArrows(ele));
    }
  },

  setConnectionDirection(direction) {
    this.connection_direction = direction;
    if(this.precanvas) {
      this.container.classList.toggle("drawflow-vertical", direction === 'vertical');
      for(var key in this.drawflow.drawflow[this.module].data) {
        this.updateConnectionNodes('node-'+key);
      }
    }
  },
};
