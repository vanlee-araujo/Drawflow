// Mouse, touch and keyboard
export default {
  /* Mobile zoom */
  pointerdown_handler(ev) {
   this.evCache.push(ev);
  },

  pointermove_handler(ev) {
   for (var i = 0; i < this.evCache.length; i++) {
     if (ev.pointerId == this.evCache[i].pointerId) {
        this.evCache[i] = ev;
     break;
     }
   }

   if (this.evCache.length == 2) {
     // Calculate the distance between the two pointers
     var curDiff = Math.abs(this.evCache[0].clientX - this.evCache[1].clientX);

     if (this.prevDiff > 100) {
       if (curDiff > this.prevDiff) {
         // The distance between the two pointers has increased

         this.zoom_in();
       }
       if (curDiff < this.prevDiff) {
         // The distance between the two pointers has decreased
         this.zoom_out();
       }
     }
     this.prevDiff = curDiff;
   }
  },

  pointerup_handler(ev) {
    this.remove_event(ev);
    if (this.evCache.length < 2) {
      this.prevDiff = -1;
    }
  },

  remove_event(ev) {
   // Remove this event from the target's cache
   for (var i = 0; i < this.evCache.length; i++) {
     if (this.evCache[i].pointerId == ev.pointerId) {
       this.evCache.splice(i, 1);
       break;
     }
   }
  },

  removeReouteConnectionSelected(){
    this.dispatch('connectionUnselected', true);
    if(this.reroute_fix_curvature) {
      this.connection_selected.parentElement.querySelectorAll(".main-path").forEach((item, i) => {
        item.classList.remove("selected");
      });
    }
  },

  click(e) {
    this.dispatch('click', e);
    if(this.editor_mode === 'fixed') {
      //return false;
       if(e.target.classList.contains('parent-drawflow') || e.target.classList.contains('drawflow')) {
         this.ele_selected = e.target.closest(".parent-drawflow");
         e.preventDefault();
       } else {
         return false;
       }
    } else if(this.editor_mode === 'view') {
      if(e.target.closest(".drawflow") != null || e.target.matches('.parent-drawflow')) {
        this.ele_selected = e.target.closest(".parent-drawflow");
        e.preventDefault();
      }
    } else {
      this.first_click = e.target;
      this.ele_selected = e.target;
      if(e.button === 0) {
        this.contextmenuDel();
      }

      if(e.target.closest(".drawflow_content_node") != null) {
        this.ele_selected = e.target.closest(".drawflow_content_node").parentElement;
      }
    }
    switch (this.elementType(this.ele_selected)) {
      case 'drawflow-node':
        if(this.multiselect && this.updateMultiSelection(this.ele_selected.id.slice(5), e.ctrlKey || e.metaKey || e.shiftKey)) {
          break;
        }
        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          if(this.node_selected != this.ele_selected) {
            this.dispatch('nodeUnselected', true);
          }
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        if(this.node_selected != this.ele_selected) {
          this.dispatch('nodeSelected', this.ele_selected.id.slice(5));
        }
        this.node_selected = this.ele_selected;
        this.node_selected.classList.add("selected");
        if(!this.draggable_inputs) {
          if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT' && e.target.hasAttribute('contenteditable') !== true) {
            this.drag = true;
          }
        } else {
          if(e.target.tagName !== 'SELECT') {
            this.drag = true;
          }
        }
        if(this.isNodeLocked(this.ele_selected.id)) {
          this.drag = false;
        }
        break;
      case 'output':
        this.connection = true;
        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          this.node_selected = null;
          this.dispatch('nodeUnselected', true);
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.drawConnection(e.target);
        break;
      case 'parent-drawflow':
        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          this.node_selected = null;
          this.dispatch('nodeUnselected', true);
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.editor_selected = true;
        break;
      case 'drawflow':
        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          this.node_selected = null;
          this.dispatch('nodeUnselected', true);
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.editor_selected = true;
        break;
      case 'main-path':
        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          this.node_selected = null;
          this.dispatch('nodeUnselected', true);
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }
        this.connection_selected = this.ele_selected;
        this.connection_selected.classList.add("selected");
        const listclassConnection = this.connection_selected.parentElement.classList;
        if(listclassConnection.length > 1){
          this.dispatch('connectionSelected', { output_id: listclassConnection[2].slice(14), input_id: listclassConnection[1].slice(13), output_class: listclassConnection[3], input_class: listclassConnection[4] });
          if(this.reroute_fix_curvature) {
            this.connection_selected.parentElement.querySelectorAll(".main-path").forEach((item, i) => {
              item.classList.add("selected");
            });
          }
        }
      break;
      case 'point':
        this.drag_point = true;
        this.ele_selected.classList.add("selected");
      break;
      case 'drawflow-delete':
        if(this.node_selected ) {
          this.removeNodeId(this.node_selected.id);
        }

        if(this.connection_selected) {
          this.removeConnection();
        }

        if(this.node_selected != null) {
          this.node_selected.classList.remove("selected");
          this.node_selected = null;
          this.dispatch('nodeUnselected', true);
        }
        if(this.connection_selected != null) {
          this.connection_selected.classList.remove("selected");
          this.removeReouteConnectionSelected();
          this.connection_selected = null;
        }

      break;
      default:
    }
    if (e.type === "touchstart") {
      this.pos_x = e.touches[0].clientX;
      this.pos_x_start = e.touches[0].clientX;
      this.pos_y = e.touches[0].clientY;
      this.pos_y_start = e.touches[0].clientY;
      this.mouse_x = e.touches[0].clientX;
      this.mouse_y = e.touches[0].clientY;
    } else {
      this.pos_x = e.clientX;
      this.pos_x_start = e.clientX;
      this.pos_y = e.clientY;
      this.pos_y_start = e.clientY;
    }
    if(this.multiselect && this.editor_selected && this.editor_mode === 'edit') {
      if(e.shiftKey) {
        this.editor_selected = false;
        this.startSelectionBox(this.pos_x, this.pos_y);
      } else {
        this.clearSelection();
      }
    }
    if (['input','output','main-path'].includes(this.ele_selected.classList[0])) {
      e.preventDefault();
      // preventDefault also stops the focus: without it the Delete key does not reach the editor
      this.container.focus({ preventScroll: true });
    }
    this.dispatch('clickEnd', e);
  },

  position(e) {
    if (e.type === "touchmove") {
      var e_pos_x = e.touches[0].clientX;
      var e_pos_y = e.touches[0].clientY;
    } else {
      var e_pos_x = e.clientX;
      var e_pos_y = e.clientY;
    }
    this.last_pointer = { x: e_pos_x, y: e_pos_y };
    // Cursor while dragging: nodes and reroute points move, the canvas pans
    this.container.classList.toggle('drawflow-dragging', !!(this.drag || this.drag_point));
    this.container.classList.toggle('drawflow-panning', !!this.editor_selected);

    if(this.connection) {
      this.updateConnection(e_pos_x, e_pos_y);
      this.setConnectionTarget(this.connectionTargetAt(e_pos_x, e_pos_y));
    }
    if(this.editor_selected) {
      x =  this.canvas_x + (-(this.pos_x - e_pos_x))
      y = this.canvas_y + (-(this.pos_y - e_pos_y))
      this.dispatch('translate', { x: x, y: y});
      this.precanvas.style.transform = "translate("+x+"px, "+y+"px) scale("+this.zoom+")";
    }
    if(this.drag) {
      e.preventDefault();
      var x = (this.pos_x - e_pos_x) * this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom);
      var y = (this.pos_y - e_pos_y) * this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom);
      this.pos_x = e_pos_x;
      this.pos_y = e_pos_y;

      this.dragNodes(x, y);
    }

    if(this.selection_box) {
      this.updateSelectionBox(e_pos_x, e_pos_y);
    }

    if(this.drag_point) {

      var x = (this.pos_x - e_pos_x) * this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom);
      var y = (this.pos_y - e_pos_y) * this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom);
      this.pos_x = e_pos_x;
      this.pos_y = e_pos_y;

      var pos_x = this.pos_x * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) - (this.precanvas.getBoundingClientRect().x * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)));
      var pos_y = this.pos_y * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) - (this.precanvas.getBoundingClientRect().y * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)));

      this.ele_selected.setAttributeNS(null, 'cx', pos_x);
      this.ele_selected.setAttributeNS(null, 'cy', pos_y);

      const nodeUpdate = this.ele_selected.parentElement.classList[2].slice(9);
      const nodeUpdateIn = this.ele_selected.parentElement.classList[1].slice(13);
      const output_class = this.ele_selected.parentElement.classList[3];
      const input_class = this.ele_selected.parentElement.classList[4];

      let numberPointPosition = Array.from(this.ele_selected.parentElement.children).indexOf(this.ele_selected)-1;

      if(this.reroute_fix_curvature) {
        const numberMainPath = this.ele_selected.parentElement.querySelectorAll(".main-path").length-1;
        numberPointPosition -= numberMainPath;
        if(numberPointPosition < 0) {
          numberPointPosition = 0;
        }
      }

      const nodeId = nodeUpdate.slice(5);
      const searchConnection = this.drawflow.drawflow[this.module].data[nodeId].outputs[output_class].connections.findIndex(function(item,i) {
        return String(item.node) === String(nodeUpdateIn) && item.output === input_class;
      });

      this.drawflow.drawflow[this.module].data[nodeId].outputs[output_class].connections[searchConnection].points[numberPointPosition] = { pos_x: pos_x, pos_y: pos_y };

      const parentSelected = this.ele_selected.parentElement.classList[2].slice(9);

      this.updateConnectionNodes(parentSelected);
    }

    if (e.type === "touchmove") {
      this.mouse_x = e_pos_x;
      this.mouse_y = e_pos_y;
    }
    this.dispatch('mouseMove', {x: e_pos_x,y: e_pos_y });
  },

  dragEnd(e) {
    if (e.type === "touchend") {
      var e_pos_x = this.mouse_x;
      var e_pos_y = this.mouse_y;
      var ele_last = document.elementFromPoint(e_pos_x, e_pos_y);
    } else {
      var e_pos_x = e.clientX;
      var e_pos_y = e.clientY;
      var ele_last = e.target;
    }

    if(this.drag) {
      if(this.pos_x_start != e_pos_x || this.pos_y_start != e_pos_y) {
        this.nodesToDrag().forEach(id => {
          const node = this.drawflow.drawflow[this.module].data[id];
          this.dispatch('nodeMoved', id);
          this.dispatch('nodePositionChanged', { id: id, pos_x: node.pos_x, pos_y: node.pos_y });
        });
      }
      this.drag_origin = {};
    }

    if(this.selection_box) {
      this.finishSelectionBox();
    }

    if(this.drag_point) {
      this.ele_selected.classList.remove("selected");
        if(this.pos_x_start != e_pos_x || this.pos_y_start != e_pos_y) {
          this.dispatch('rerouteMoved', this.ele_selected.parentElement.classList[2].slice(14));
        }
    }

    if(this.editor_selected) {
      this.canvas_x = this.canvas_x + (-(this.pos_x - e_pos_x));
      this.canvas_y = this.canvas_y + (-(this.pos_y - e_pos_y));
      this.editor_selected = false;
    }
    if(this.connection === true) {
      this.setConnectionTarget(null);
      if(ele_last && (ele_last.classList[0] === 'input' || (this.force_first_input && ele_last.closest(".drawflow-node") != null))) {

        if(ele_last.classList[0] !== 'input') {
          var input_id = ele_last.closest(".drawflow-node").id;
          var input_class = this.firstInputClass(input_id.slice(5));


       } else {
         // Fix connection;
         var input_id = ele_last.parentElement.parentElement.id;
         var input_class = ele_last.classList[1];
       }
       var output_id = this.ele_selected.parentElement.parentElement.id;
       var output_class = this.ele_selected.classList[1];

        if(output_id !== input_id && input_class !== false) {

          if(this.container.querySelectorAll('.connection.node_in_'+input_id+'.node_out_'+output_id+'.'+output_class+'.'+input_class).length === 0
            && this.validateConnection(output_id.slice(5), input_id.slice(5), output_class, input_class)) {
          // Conection no exist save connection

          this.connection_ele.classList.add("node_in_"+input_id);
          this.connection_ele.classList.add("node_out_"+output_id);
          this.connection_ele.classList.add(output_class);
          this.connection_ele.classList.add(input_class);
          var id_input = input_id.slice(5);
          var id_output = output_id.slice(5);
          this.connection_ele.classList.add(...this.connectionClassesFromNode(id_output));

          this.drawflow.drawflow[this.module].data[id_output].outputs[output_class].connections.push( {"node": id_input, "output": input_class});
          this.drawflow.drawflow[this.module].data[id_input].inputs[input_class].connections.push( {"node": id_output, "input": output_class});
          this.updateConnectionNodes('node-'+id_output);
          this.updateConnectionNodes('node-'+id_input);
          this.dispatch('connectionCreated', { output_id: id_output, input_id: id_input, output_class:  output_class, input_class: input_class});

        } else {
          this.dispatch('connectionCancel', true);
          this.connection_ele.remove();
        }

          this.connection_ele = null;
      } else {
        // Connection exists Remove Connection;
        this.dispatch('connectionCancel', true);
        this.connection_ele.remove();
        this.connection_ele = null;
      }

      } else {
        // Remove Connection;
        this.dispatch('connectionCancel', true);
        this.connection_ele.remove();
        this.connection_ele = null;
      }
    }

    this.drag = false;
    this.drag_point = false;
    this.connection = false;
    this.ele_selected = null;
    this.editor_selected = false;
    this.container.classList.remove('drawflow-dragging', 'drawflow-panning');

    this.dispatch('mouseUp', e);
  },

  // The window lost the focus (another window, alt+tab) in the middle of a drag: end it where the pointer was,
  // on the container, so that a connection being drawn is cancelled
  cancelPointer() {
    if(!(this.drag || this.drag_point || this.editor_selected || this.connection || this.selection_box)) {
      return false;
    }
    const pointer = this.last_pointer || { x: this.pos_x, y: this.pos_y };
    this.dragEnd({ type: 'mouseup', clientX: pointer.x, clientY: pointer.y, target: this.container });
    return true;
  },

  contextmenu(e) {
    this.dispatch('contextmenu', e);
    e.preventDefault();
    if(this.editor_mode === 'fixed' || this.editor_mode === 'view') {
      return false;
    }
    this.contextmenuDel();
    if(this.node_selected || this.connection_selected) {
      var deletebox = document.createElement('div');
      deletebox.classList.add("drawflow-delete");
      deletebox.innerHTML = "✕";
      if(this.node_selected) {
        this.node_selected.appendChild(deletebox);

      }
      if(this.connection_selected && (this.connection_selected.parentElement.classList.length > 1)) {
        deletebox.style.top = e.clientY * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) - (this.precanvas.getBoundingClientRect().y *  ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) ) + "px";
        deletebox.style.left = e.clientX * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) - (this.precanvas.getBoundingClientRect().x *  ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) ) + "px";

        this.precanvas.appendChild(deletebox);

      }

    }

  },

  contextmenuDel() {
    if(this.precanvas.getElementsByClassName("drawflow-delete").length) {
      this.precanvas.getElementsByClassName("drawflow-delete")[0].remove()
    };
  },

  key(e) {
    this.dispatch('keydown', e);
    if(this.editor_mode === 'fixed' || this.editor_mode === 'view') {
      return false;
    }
    if (this.history && (e.ctrlKey || e.metaKey) && !this.isTyping(e.target)) {
      const key = e.key.toLowerCase();
      if(key === 'z' || key === 'y') {
        e.preventDefault();
        if(key === 'y' || e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
    }
    if (this.multiselect && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !this.isTyping(e.target)) {
      e.preventDefault();
      this.selectNodes(Object.keys(this.drawflow.drawflow[this.module].data));
    }
    if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) {
      if(this.selected_nodes.length > 0 && !this.isTyping(this.first_click)) {
        this.selected_nodes.slice().forEach(id => this.removeNodeId(id));
        this.clearSelection();
      } else if(this.node_selected != null) {
        if(this.first_click.tagName !== 'INPUT' && this.first_click.tagName !== 'TEXTAREA' && this.first_click.hasAttribute('contenteditable') !== true) {
          this.removeNodeId(this.node_selected.id);
        }
      }
      if(this.connection_selected != null) {
        this.removeConnection();
      }
    }
  },

  dblclick(e) {
    if(e.target.classList.contains('main-path') && e.target.parentElement.classList.contains('connection')) {
      const list = e.target.parentElement.classList;
      this.dispatch('connectionDblClick', { output_id: list[2].slice(14), input_id: list[1].slice(13), output_class: list[3], input_class: list[4] });
    }
    if(this.connection_selected != null && this.reroute) {
        this.createReroutePoint(this.connection_selected);
    }

    if(e.target.classList[0] === 'point') {
        this.removeReroutePoint(e.target);
    }
  },
};
