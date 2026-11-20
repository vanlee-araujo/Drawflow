// Nodes and their data (the inputs and outputs are in ports.js)
// df-* fields: checkbox and radio use checked, the others value
function setFieldValue(ele, value) {
  if(ele.type === 'checkbox') {
    ele.checked = value === true || value === 'true' || value === 'on';
  } else if(ele.type === 'radio') {
    ele.checked = String(ele.value) === String(value);
  } else {
    ele.value = value;
  }
}

export default {
  registerNode(name, html, props = null, options = null) {
    this.noderegister[name] = {html: html, props: props, options: options};
  },

  // HTML written into a node: passed through sanitize_html when the application gives one
  nodeHtml(html) {
    return typeof this.sanitize_html === 'function' ? this.sanitize_html(html) : html;
  },

  getNodeFromId(id) {
    id = this.nodeKey(id);
    var moduleName = this.getModuleFromNodeId(id)
    return JSON.parse(JSON.stringify(this.drawflow.drawflow[moduleName].data[id]));
  },

  setNodePosition(id, pos_x, pos_y) {
    id = this.nodeKey(id);
    var moduleName = this.getModuleFromNodeId(id);
    var dataNode = this.drawflow.drawflow[moduleName].data[id];
    dataNode.pos_x = pos_x;
    dataNode.pos_y = pos_y;
    if(this.module === moduleName) {
      var node = this.container.querySelector('#node-'+id);
      node.style.left = pos_x + "px";
      node.style.top = pos_y + "px";
      this.updateConnectionNodes('node-'+id);
    }
    this.dispatch('nodeMoved', id.toString());
    this.dispatch('nodePositionChanged', { id: id.toString(), pos_x: pos_x, pos_y: pos_y });
  },

  // Ids of the nodes of a module (the current one by default)
  getAllNodes(moduleName = this.module) {
    const module = this.drawflow.drawflow[moduleName];
    return module ? Object.keys(module.data) : [];
  },

  // Ids of the nodes connected to a node, on every port or on one ('input_1', 'output_2')
  getConnectedNodes(id, port) {
    id = this.nodeKey(id);
    const moduleName = this.getModuleFromNodeId(id);
    if(!moduleName) {
      return [];
    }
    const node = this.drawflow.drawflow[moduleName].data[id];
    const ports = Object.assign({}, node.inputs, node.outputs);
    const names = port === undefined ? Object.keys(ports) : [port];
    const ids = [];
    names.forEach(name => {
      (ports[name] ? ports[name].connections : []).forEach(connection => {
        const other = String(connection.node);
        if(!ids.includes(other)) {
          ids.push(other);
        }
      });
    });
    return ids;
  },

  // New HTML for a node created with HTML (typenode false): the fields get the values of its data again
  updateNodeHtmlFromId(id, html) {
    id = this.nodeKey(id);
    const moduleName = this.getModuleFromNodeId(id);
    const node = moduleName && this.drawflow.drawflow[moduleName].data[id];
    if(!node || node.typenode !== false) {
      return false;
    }
    node.html = html;
    if(this.module === moduleName) {
      this.container.querySelector('#node-' + id + ' .drawflow_content_node').innerHTML = this.nodeHtml(html);
      this.updateNodeDataFromId(id, node.data);
      this.updateConnectionNodes('node-' + id);
    }
    this.dispatch('nodeHtmlChanged', id);
    return true;
  },

  getNodesFromName(name) {
    var nodes = [];
    const editor = this.drawflow.drawflow
    Object.keys(editor).map(function(moduleName, index) {
      for (var node in editor[moduleName].data) {
        if(editor[moduleName].data[node].name == name) {
          nodes.push(editor[moduleName].data[node].id);
        }
      }
    });
    return nodes;
  },

  addNode (name, num_in, num_out, ele_pos_x, ele_pos_y, classoverride, data, html, typenode = false) {
    if (this.useuuid) {
      var newNodeId = this.getUuid();
    } else {
      var newNodeId = this.nodeId;
    }
    const parent = document.createElement('div');
    parent.classList.add("parent-node");

    const node = document.createElement('div');
    node.innerHTML = "";
    node.setAttribute("id", "node-"+newNodeId);
    node.classList.add("drawflow-node");
    if(classoverride != '') {
      node.classList.add(...classoverride.split(' ').filter(name => name !== ''));
    }

    const inputs = document.createElement('div');
    inputs.classList.add("inputs");

    const outputs = document.createElement('div');
    outputs.classList.add("outputs");

    const json_inputs = {}
    for(var x = 0; x < num_in; x++) {
      const input = document.createElement('div');
      input.classList.add("input");
      input.classList.add("input_"+(x+1));
      json_inputs["input_"+(x+1)] = { "connections": []};
      inputs.appendChild(input);
    }

    const json_outputs = {}
    for(var x = 0; x < num_out; x++) {
      const output = document.createElement('div');
      output.classList.add("output");
      output.classList.add("output_"+(x+1));
      if(classoverride != '') {
        output.classList.add(...classoverride.split(' ').filter(name => name !== '').map(name => 'connection-'+name));
      }
      json_outputs["output_"+(x+1)] = { "connections": []};
      outputs.appendChild(output);
    }

    const content = document.createElement('div');
    content.classList.add("drawflow_content_node");
    if(typenode === false) {
      content.innerHTML = this.nodeHtml(html);
    } else if (typenode === true) {
      content.appendChild(this.noderegister[html].html.cloneNode(true));
    } else {
      if(parseInt(this.render.version) === 3 ) {
        //Vue 3
        let wrapper = this.render.h(this.noderegister[html].html, this.noderegister[html].props, this.noderegister[html].options);
        wrapper.appContext = this.parent;
        this.render.render(wrapper,content);

      } else {
        // Vue 2
        let wrapper = new this.render({
          parent: this.parent,
          render: h => h(this.noderegister[html].html, { props: this.noderegister[html].props }),
          ...this.noderegister[html].options
        }).$mount()
        //
        content.appendChild(wrapper.$el);
      }
    }

    Object.entries(data).forEach(function (key, value) {
      if(typeof key[1] === "object") {
        insertObjectkeys(null, key[0], key[0]);
      } else {
        var elems = content.querySelectorAll('[df-'+CSS.escape(key[0])+']');
          for(var i = 0; i < elems.length; i++) {
            setFieldValue(elems[i], key[1]);
            if(elems[i].isContentEditable) {
              elems[i].innerText = key[1];
            }
          }
      }
    })

    function insertObjectkeys(object, name, completname) {
      if(object === null) {
        var object = data[name];
      } else {
        var object = object[name]
      }
      if(object !== null) {
        Object.entries(object).forEach(function (key, value) {
          if(typeof key[1] === "object") {
            insertObjectkeys(object, key[0], completname+'-'+key[0]);
          } else {
            var elems = content.querySelectorAll('[df-'+CSS.escape(completname+'-'+key[0])+']');
              for(var i = 0; i < elems.length; i++) {
                setFieldValue(elems[i], key[1]);
                if(elems[i].isContentEditable) {
                  elems[i].innerText = key[1];
                }
              }
          }
        });
      }
    }
    node.appendChild(inputs);
    node.appendChild(content);
    node.appendChild(outputs);
    node.style.top = ele_pos_y + "px";
    node.style.left = ele_pos_x + "px";
    parent.appendChild(node);
    this.precanvas.appendChild(parent);
    if(this.resize_observer) {
      this.resize_observer.observe(node);
    }
    var json = {
      id: newNodeId,
      name: name,
      data: data,
      class: classoverride,
      html: html,
      typenode: typenode,
      inputs: json_inputs,
      outputs: json_outputs,
      pos_x: ele_pos_x,
      pos_y: ele_pos_y,
    }
    this.drawflow.drawflow[this.module].data[newNodeId] = json;
    this.dispatch('nodeCreated', newNodeId);
    if (!this.useuuid) {
      this.nodeId++;
    }
    return newNodeId;
  },

  addNodeImport (dataNode, precanvas) {
    const connectionClasses = this.connectionClassesFromNode.bind(this);
    const parent = document.createElement('div');
    parent.classList.add("parent-node");

    const node = document.createElement('div');
    node.innerHTML = "";
    node.setAttribute("id", "node-"+dataNode.id);
    node.classList.add("drawflow-node");
    if(dataNode.class != '') {
      node.classList.add(...dataNode.class.split(' ').filter(name => name !== ''));
    }
    if(dataNode.locked) {
      node.classList.add('locked');
    }

    const inputs = document.createElement('div');
    inputs.classList.add("inputs");

    const outputs = document.createElement('div');
    outputs.classList.add("outputs");

    Object.keys(dataNode.inputs).map(function(input_item, index) {
      const input = document.createElement('div');
      input.classList.add("input");
      input.classList.add(input_item);
      inputs.appendChild(input);
      Object.keys(dataNode.inputs[input_item].connections).map(function(output_item, index) {

        var connection = document.createElementNS('http://www.w3.org/2000/svg',"svg");
        var path = document.createElementNS('http://www.w3.org/2000/svg',"path");
        path.classList.add("main-path");
        path.setAttributeNS(null, 'd', '');
        // path.innerHTML = 'a';
        connection.classList.add("connection");
        connection.classList.add("node_in_node-"+dataNode.id);
        connection.classList.add("node_out_node-"+dataNode.inputs[input_item].connections[output_item].node);
        connection.classList.add(dataNode.inputs[input_item].connections[output_item].input);
        connection.classList.add(input_item);
        connection.classList.add(...connectionClasses(dataNode.inputs[input_item].connections[output_item].node));

        connection.appendChild(path);
        precanvas.appendChild(connection);

      });
    });

    Object.keys(dataNode.outputs).forEach(output_item => {
      const output = document.createElement('div');
      output.classList.add("output");
      output.classList.add(output_item);
      output.classList.add(...connectionClasses(dataNode.id));
      outputs.appendChild(output);
    });

    const content = document.createElement('div');
    content.classList.add("drawflow_content_node");

    if(dataNode.typenode === false) {
      content.innerHTML = this.nodeHtml(dataNode.html);
    } else if (dataNode.typenode === true) {
      content.appendChild(this.noderegister[dataNode.html].html.cloneNode(true));
    } else {
      if(parseInt(this.render.version) === 3 ) {
        //Vue 3
        let wrapper = this.render.h(this.noderegister[dataNode.html].html, this.noderegister[dataNode.html].props, this.noderegister[dataNode.html].options);
        wrapper.appContext = this.parent;
        this.render.render(wrapper,content);

      } else {
        //Vue 2
        let wrapper = new this.render({
          parent: this.parent,
          render: h => h(this.noderegister[dataNode.html].html, { props: this.noderegister[dataNode.html].props }),
          ...this.noderegister[dataNode.html].options
        }).$mount()
        content.appendChild(wrapper.$el);
      }
    }

    Object.entries(dataNode.data).forEach(function (key, value) {
      if(typeof key[1] === "object") {
        insertObjectkeys(null, key[0], key[0]);
      } else {
        var elems = content.querySelectorAll('[df-'+CSS.escape(key[0])+']');
          for(var i = 0; i < elems.length; i++) {
            setFieldValue(elems[i], key[1]);
            if(elems[i].isContentEditable) {
              elems[i].innerText = key[1];
            }
          }
      }
    })

    function insertObjectkeys(object, name, completname) {
      if(object === null) {
        var object = dataNode.data[name];
      } else {
        var object = object[name]
      }
      if(object !== null) {
        Object.entries(object).forEach(function (key, value) {
          if(typeof key[1] === "object") {
            insertObjectkeys(object, key[0], completname+'-'+key[0]);
          } else {
            var elems = content.querySelectorAll('[df-'+CSS.escape(completname+'-'+key[0])+']');
              for(var i = 0; i < elems.length; i++) {
                setFieldValue(elems[i], key[1]);
                if(elems[i].isContentEditable) {
                  elems[i].innerText = key[1];
                }
              }
          }
        });
      }
    }
    node.appendChild(inputs);
    node.appendChild(content);
    node.appendChild(outputs);
    node.style.top = dataNode.pos_y + "px";
    node.style.left = dataNode.pos_x + "px";
    parent.appendChild(node);
    this.precanvas.appendChild(parent);
    if(this.resize_observer) {
      this.resize_observer.observe(node);
    }
  },

  updateNodeValue(event) {
    var attr = event.target.attributes
    for (var i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.startsWith('df-')) {
                var keys = attr[i].nodeName.slice(3).split("-");
                var target = this.drawflow.drawflow[this.module].data[event.target.closest(".drawflow_content_node").parentElement.id.slice(5)].data;
                for (var index = 0; index < keys.length - 1; index += 1) {
                    if (target[keys[index]] == null) {
                        target[keys[index]] = {};
                    }
                    target = target[keys[index]];
                }
                target[keys[keys.length - 1]] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
                if(event.target.isContentEditable) {
                  target[keys[keys.length - 1]] = event.target.innerText;
                }
                this.dispatch('nodeDataChanged', event.target.closest(".drawflow_content_node").parentElement.id.slice(5));
          }
    }
  },

  updateNodeDataFromId(id, data) {
    id = this.nodeKey(id);
    var moduleName = this.getModuleFromNodeId(id)
    this.drawflow.drawflow[moduleName].data[id].data = data;
    if(this.module === moduleName) {
      const content = this.container.querySelector('#node-'+id);

      Object.entries(data).forEach(function (key, value) {
        if(typeof key[1] === "object") {
          insertObjectkeys(null, key[0], key[0]);
        } else {
          var elems = content.querySelectorAll('[df-'+CSS.escape(key[0])+']');
            for(var i = 0; i < elems.length; i++) {
              setFieldValue(elems[i], key[1]);
              if(elems[i].isContentEditable) {
                elems[i].innerText = key[1];
              }
            }
        }
      })

      function insertObjectkeys(object, name, completname) {
        if(object === null) {
          var object = data[name];
        } else {
          var object = object[name]
        }
        if(object !== null) {
          Object.entries(object).forEach(function (key, value) {
            if(typeof key[1] === "object") {
              insertObjectkeys(object, key[0], completname+'-'+key[0]);
            } else {
              var elems = content.querySelectorAll('[df-'+CSS.escape(completname+'-'+key[0])+']');
                for(var i = 0; i < elems.length; i++) {
                  setFieldValue(elems[i], key[1]);
                  if(elems[i].isContentEditable) {
                    elems[i].innerText = key[1];
                  }
                }
            }
          });
        }
      }

    }
  },

  removeNodeId(id) {
    id = this.nodeElementId(id);
    if(!this.canRemoveNode(id.slice(5))) {
      return false;
    }
    this.removeConnectionNodeId(id);
    var moduleName = this.getModuleFromNodeId(id.slice(5))
    if(this.module === moduleName) {
      const node = this.container.querySelector(`#${id}`);
      if(this.resize_observer) {
        this.resize_observer.unobserve(node);
      }
      node.remove();
    }
    delete this.drawflow.drawflow[moduleName].data[id.slice(5)];
    this.dispatch('nodeRemoved', id.slice(5));
    return true;
  },

  canRemoveNode(id) {
    if(this.isNodeLocked(id)) {
      return false;
    }
    return typeof this.node_remove_validator !== 'function' || this.node_remove_validator(id) !== false;
  },

  // A locked node cannot be dragged or removed; its fields and connections still work
  setNodeLocked(id, locked = true) {
    id = this.nodeKey(id);
    const moduleName = this.getModuleFromNodeId(id);
    if(locked) {
      this.drawflow.drawflow[moduleName].data[id].locked = true;
    } else {
      delete this.drawflow.drawflow[moduleName].data[id].locked;
    }
    if(this.module === moduleName) {
      this.container.querySelector('#node-'+id).classList.toggle('locked', locked);
    }
    this.dispatch('nodeLocked', { id: id, locked: locked });
  },

  isNodeLocked(id) {
    id = this.nodeKey(id);
    const moduleName = this.getModuleFromNodeId(id);
    return moduleName !== undefined && this.drawflow.drawflow[moduleName].data[id].locked === true;
  },
};
