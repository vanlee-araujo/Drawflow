// Creating, drawing and removing connections
export default {
  validateConnection(id_output, id_input, output_class, input_class) {
    if(typeof this.connection_validator !== 'function') {
      return true;
    }
    return this.connection_validator({ output_id: id_output.toString(), input_id: id_input.toString(), output_class: output_class, input_class: input_class }) !== false;
  },

  drawConnection(ele) {
    var connection = document.createElementNS('http://www.w3.org/2000/svg',"svg");
    this.connection_ele = connection;
    var path = document.createElementNS('http://www.w3.org/2000/svg',"path");
    path.classList.add("main-path");
    path.setAttributeNS(null, 'd', '');
    // path.innerHTML = 'a';
    connection.classList.add("connection");
    connection.appendChild(path);
    this.precanvas.appendChild(connection);
    this.updateConnectionArrows(connection);
    var id_output = ele.parentElement.parentElement.id.slice(5);
    var output_class = ele.classList[1];
    this.dispatch('connectionStart', { output_id: id_output, output_class:  output_class });

  },

  updateConnection(eX, eY) {
    const precanvas = this.precanvas;
    const zoom = this.zoom;
    let precanvasWitdhZoom = precanvas.clientWidth / (precanvas.clientWidth * zoom);
    precanvasWitdhZoom = precanvasWitdhZoom || 0;
    let precanvasHeightZoom = precanvas.clientHeight / (precanvas.clientHeight * zoom);
    precanvasHeightZoom = precanvasHeightZoom || 0;
    var path = this.connection_ele.children[0];

    var line_x = this.ele_selected.offsetWidth/2 + (this.ele_selected.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
    var line_y = this.ele_selected.offsetHeight/2 + (this.ele_selected.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

    var x = eX * ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) - (this.precanvas.getBoundingClientRect().x *  ( this.precanvas.clientWidth / (this.precanvas.clientWidth * this.zoom)) );
    var y = eY * ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) - (this.precanvas.getBoundingClientRect().y *  ( this.precanvas.clientHeight / (this.precanvas.clientHeight * this.zoom)) );

    var curvature = this.curvature;
    var lineCurve = this.createCurvature(line_x, line_y, x, y, curvature, 'openclose');
    path.setAttributeNS(null, 'd', lineCurve);

  },

  addConnection(id_output, id_input, output_class, input_class) {
    id_output = this.nodeKey(id_output);
    id_input = this.nodeKey(id_input);
    var nodeOneModule = this.getModuleFromNodeId(id_output);
    var nodeTwoModule = this.getModuleFromNodeId(id_input);
    if(nodeOneModule === nodeTwoModule) {

      var dataNode = this.getNodeFromId(id_output);
      var exist = false;
      for(var checkOutput in dataNode.outputs[output_class].connections){
        var connectionSearch = dataNode.outputs[output_class].connections[checkOutput]
        if(connectionSearch.node == id_input && connectionSearch.output == input_class) {
            exist = true;
        }
      }
      // Check connection exist
      if(exist === false && this.validateConnection(id_output, id_input, output_class, input_class)) {
        //Create Connection
        this.drawflow.drawflow[nodeOneModule].data[id_output].outputs[output_class].connections.push( {"node": id_input.toString(), "output": input_class});
        this.drawflow.drawflow[nodeOneModule].data[id_input].inputs[input_class].connections.push( {"node": id_output.toString(), "input": output_class});

        if(this.module === nodeOneModule) {
        //Draw connection
          var connection = document.createElementNS('http://www.w3.org/2000/svg',"svg");
          var path = document.createElementNS('http://www.w3.org/2000/svg',"path");
          path.classList.add("main-path");
          path.setAttributeNS(null, 'd', '');
          // path.innerHTML = 'a';
          connection.classList.add("connection");
          connection.classList.add("node_in_node-"+id_input);
          connection.classList.add("node_out_node-"+id_output);
          connection.classList.add(output_class);
          connection.classList.add(input_class);
          connection.classList.add(...this.connectionClassesFromNode(id_output));
          connection.appendChild(path);
          this.precanvas.appendChild(connection);
          this.updateConnectionNodes('node-'+id_output);
          this.updateConnectionNodes('node-'+id_input);
        }

        this.dispatch('connectionCreated', { output_id: id_output, input_id: id_input, output_class:  output_class, input_class: input_class});
      }
    }
  },

  updateConnectionNodes(id) {
    id = this.nodeElementId(id);

    // Aquí nos quedamos;
    const idSearch = 'node_in_'+id;
    const idSearchOut = 'node_out_'+id;
    var line_path = this.line_path/2;
    const container = this.container;
    const precanvas = this.precanvas;
    const curvature = this.curvature;
    const createCurvature = this.createCurvature.bind(this);
    const reroute_curvature = this.reroute_curvature;
    const reroute_curvature_start_end = this.reroute_curvature_start_end;
    const reroute_fix_curvature = this.reroute_fix_curvature;
    const rerouteWidth = this.reroute_width;
    const zoom = this.zoom;
    let precanvasWitdhZoom = precanvas.clientWidth / (precanvas.clientWidth * zoom);
    precanvasWitdhZoom = precanvasWitdhZoom || 0;
    let precanvasHeightZoom = precanvas.clientHeight / (precanvas.clientHeight * zoom);
    precanvasHeightZoom = precanvasHeightZoom || 0;

    const elemsOut = container.querySelectorAll(`.${idSearchOut}`);

    Object.keys(elemsOut).map(function(item, index) {
      if(elemsOut[item].querySelector('.point') === null) {

        var elemtsearchId_out = container.querySelector(`#${id}`);

        var id_search = elemsOut[item].classList[1].replace('node_in_', '');
        var elemtsearchId = container.querySelector(`#${id_search}`);

        var elemtsearch = elemtsearchId.querySelectorAll('.'+elemsOut[item].classList[4])[0]

        var eX = elemtsearch.offsetWidth/2 + (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
        var eY = elemtsearch.offsetHeight/2 + (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

        var elemtsearchOut = elemtsearchId_out.querySelectorAll('.'+elemsOut[item].classList[3])[0]

        var line_x =  elemtsearchOut.offsetWidth/2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
        var line_y =  elemtsearchOut.offsetHeight/2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

        var x = eX;
        var y = eY;

        const lineCurve = createCurvature(line_x, line_y, x, y, curvature, 'openclose');
        elemsOut[item].children[0].setAttributeNS(null, 'd', lineCurve );
      } else {
        const points = elemsOut[item].querySelectorAll('.point');
        let linecurve = '';
        const reoute_fix = [];
        points.forEach((item, i) => {
          if(i === 0 && ((points.length -1) === 0)) {

            var elemtsearchId_out = container.querySelector(`#${id}`);
            var elemtsearch = item;

            var eX =  (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY =  (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;

            var elemtsearchOut = elemtsearchId_out.querySelectorAll('.'+item.parentElement.classList[3])[0]
            var line_x =  elemtsearchOut.offsetWidth/2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var line_y =  elemtsearchOut.offsetHeight/2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'open');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

            var elemtsearchId_out = item;
            var id_search = item.parentElement.classList[1].replace('node_in_', '');
            var elemtsearchId = container.querySelector(`#${id_search}`);
            var elemtsearch = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]

            var elemtsearchIn = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]
            var eX =  elemtsearchIn.offsetWidth/2 + (elemtsearchIn.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var eY =  elemtsearchIn.offsetHeight/2 + (elemtsearchIn.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;


            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'close');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else if(i === 0) {

            var elemtsearchId_out = container.querySelector(`#${id}`);
            var elemtsearch = item;

            var eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;

            var elemtsearchOut = elemtsearchId_out.querySelectorAll('.'+item.parentElement.classList[3])[0]
            var line_x =  elemtsearchOut.offsetWidth/2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var line_y =  elemtsearchOut.offsetHeight/2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'open');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

            // SECOND
            var elemtsearchId_out = item;
            var elemtsearch = points[i+1];

            var eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature, 'other');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else if (i === (points.length -1)) {

            var elemtsearchId_out = item;

            var id_search = item.parentElement.classList[1].replace('node_in_', '');
            var elemtsearchId = container.querySelector(`#${id_search}`);
            var elemtsearch = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]

            var elemtsearchIn = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]
            var eX =  elemtsearchIn.offsetWidth/2 + (elemtsearchIn.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var eY =  elemtsearchIn.offsetHeight/2 + (elemtsearchIn.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;
            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'close');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else {
            var elemtsearchId_out = item;
            var elemtsearch = points[i+1];

            var eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            var eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) +rerouteWidth;
            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature, 'other');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);
          }

        });
        if(reroute_fix_curvature) {
          reoute_fix.forEach((itempath, i) => {
            elemsOut[item].children[i].setAttributeNS(null, 'd', itempath);
          });

        } else {
          elemsOut[item].children[0].setAttributeNS(null, 'd', linecurve);
        }

      }
    })

    const elems = container.querySelectorAll(`.${idSearch}`);
    Object.keys(elems).map(function(item, index) {

      if(elems[item].querySelector('.point') === null) {
        var elemtsearchId_in = container.querySelector(`#${id}`);

        var id_search = elems[item].classList[2].replace('node_out_', '');
        var elemtsearchId = container.querySelector(`#${id_search}`);
        var elemtsearch = elemtsearchId.querySelectorAll('.'+elems[item].classList[3])[0]

        var line_x = elemtsearch.offsetWidth/2 + (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
        var line_y = elemtsearch.offsetHeight/2 + (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

        var elemtsearchId_in = elemtsearchId_in.querySelectorAll('.'+elems[item].classList[4])[0]
        var x = elemtsearchId_in.offsetWidth/2 + (elemtsearchId_in.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
        var y = elemtsearchId_in.offsetHeight/2 + (elemtsearchId_in.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

        const lineCurve = createCurvature(line_x, line_y, x, y, curvature, 'openclose');
        elems[item].children[0].setAttributeNS(null, 'd', lineCurve );

      } else {
        const points = elems[item].querySelectorAll('.point');
        let linecurve = '';
        const reoute_fix = [];
        points.forEach((item, i) => {
          if(i === 0 && ((points.length -1) === 0)) {

            var elemtsearchId_out = item;
            var id_search = item.parentElement.classList[2].replace('node_out_', '');
            var elemtsearchId = container.querySelector(`#${id_search}`);
            var elemtsearch = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[3])[0]

            var elemtsearchOut = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[3])[0]
            var line_x =  elemtsearchOut.offsetWidth/2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var line_y =  elemtsearchOut.offsetHeight/2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

            var eX = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'open');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

            var elemtsearchId_out = container.querySelector(`#${id}`);
            var elemtsearch = item;

            var line_x = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom +rerouteWidth;

            var elemtsearchIn = elemtsearchId_out.querySelectorAll('.'+item.parentElement.classList[4])[0]
            var eX =  elemtsearchIn.offsetWidth/2 + (elemtsearchIn.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var eY =  elemtsearchIn.offsetHeight/2 + (elemtsearchIn.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'close');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else if(i === 0) {
            // FIRST
            var elemtsearchId_out = item;
            var id_search = item.parentElement.classList[2].replace('node_out_', '');
            var elemtsearchId = container.querySelector(`#${id_search}`);
            var elemtsearch = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[3])[0]
            var elemtsearchOut = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[3])[0]
            var line_x =  elemtsearchOut.offsetWidth/2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var line_y =  elemtsearchOut.offsetHeight/2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

            var eX = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'open');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

            // SECOND
            var elemtsearchId_out = item;
            var elemtsearch = points[i+1];

            var eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom +rerouteWidth;
            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature, 'other');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else if (i === (points.length -1)) {

            var elemtsearchId_out = item;

            var id_search = item.parentElement.classList[1].replace('node_in_', '');
            var elemtsearchId = container.querySelector(`#${id_search}`);
            var elemtsearch = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]

            var elemtsearchIn = elemtsearchId.querySelectorAll('.'+item.parentElement.classList[4])[0]
            var eX =  elemtsearchIn.offsetWidth/2 + (elemtsearchIn.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom;
            var eY =  elemtsearchIn.offsetHeight/2 + (elemtsearchIn.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom;

            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature_start_end, 'close');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else {

            var elemtsearchId_out = item;
            var elemtsearch = points[i+1];

            var eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom +rerouteWidth;
            var line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x ) * precanvasWitdhZoom + rerouteWidth;
            var line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y ) * precanvasHeightZoom + rerouteWidth;
            var x = eX;
            var y = eY;

            var lineCurveSearch = createCurvature(line_x, line_y, x, y, reroute_curvature, 'other');
            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);
          }

        });
        if(reroute_fix_curvature) {
          reoute_fix.forEach((itempath, i) => {
            elems[item].children[i].setAttributeNS(null, 'd', itempath);
          });

        } else {
          elems[item].children[0].setAttributeNS(null, 'd', linecurve);
        }

      }
    })

    elemsOut.forEach(ele => this.updateConnectionArrows(ele));
    elems.forEach(ele => this.updateConnectionArrows(ele));
  },

  firstInputClass(id) {
    const inputs = Object.keys(this.drawflow.drawflow[this.getModuleFromNodeId(id)].data[id].inputs);
    return inputs.length === 0 ? false : inputs[0];
  },

  connectionClassesFromNode(id) {
    const dataNode = this.drawflow.drawflow[this.module].data[id];
    if(!dataNode || typeof dataNode.class !== 'string') {
      return [];
    }
    return dataNode.class.split(' ').filter(name => name !== '').map(name => 'connection-'+name);
  },

  connectionTargetAt(e_pos_x, e_pos_y) {
    const ele = document.elementFromPoint(e_pos_x, e_pos_y);
    if(!ele || !this.container.contains(ele)) {
      return null;
    }
    const node = ele.closest(".drawflow-node");
    if(!node || node === this.ele_selected.parentElement.parentElement) {
      return null;
    }
    // Dropping connects only on an input, or anywhere on the node with force_first_input
    if(ele.classList[0] !== 'input' && !(this.force_first_input && this.firstInputClass(node.id.slice(5)) !== false)) {
      return null;
    }
    return node;
  },

  setConnectionTarget(node) {
    if(this.connection_target === node) {
      return;
    }
    if(this.connection_target) {
      this.connection_target.classList.remove(this.connection_target_class);
    }
    if(node) {
      node.classList.add(this.connection_target_class);
    }
    this.connection_target = node;
  },

  // Removes one connection from both sides of the data. Ids are compared as text: imported data may use numbers
  removeConnectionData(moduleName, id_output, output_class, id_input, input_class) {
    const data = this.drawflow.drawflow[moduleName].data;
    const outputs = data[id_output] && data[id_output].outputs[output_class] ? data[id_output].outputs[output_class].connections : [];
    const index_out = outputs.findIndex(item => String(item.node) === String(id_input) && item.output === input_class);
    if(index_out > -1) {
      outputs.splice(index_out, 1);
    }
    const inputs = data[id_input] && data[id_input].inputs[input_class] ? data[id_input].inputs[input_class].connections : [];
    const index_in = inputs.findIndex(item => String(item.node) === String(id_output) && item.input === output_class);
    if(index_in > -1) {
      inputs.splice(index_in, 1);
    }
  },

  removeConnection() {
    if(this.connection_selected != null) {
      var listclass = this.connection_selected.parentElement.classList;
      this.connection_selected.parentElement.remove();
      this.removeConnectionData(this.module, listclass[2].slice(14), listclass[3], listclass[1].slice(13), listclass[4]);
      this.dispatch('connectionRemoved', { output_id: listclass[2].slice(14), input_id: listclass[1].slice(13), output_class: listclass[3], input_class: listclass[4] } );
      this.connection_selected = null;
    }
  },

  removeSingleConnection(id_output, id_input, output_class, input_class) {
    id_output = this.nodeKey(id_output);
    id_input = this.nodeKey(id_input);
    var nodeOneModule = this.getModuleFromNodeId(id_output);
    var nodeTwoModule = this.getModuleFromNodeId(id_input);
    if(nodeOneModule === nodeTwoModule) {
      // Check nodes in same module.

      // Check connection exist
      var exists = this.drawflow.drawflow[nodeOneModule].data[id_output].outputs[output_class].connections.findIndex(function(item,i) {
        return item.node == id_input && item.output === input_class
      });
      if(exists > -1) {

        if(this.module === nodeOneModule) {
          // In same module with view.
          this.container.querySelector('.connection.node_in_node-'+id_input+'.node_out_node-'+id_output+'.'+output_class+'.'+input_class).remove();
        }

        this.removeConnectionData(nodeOneModule, id_output, output_class, id_input, input_class);

        this.dispatch('connectionRemoved', { output_id: id_output, input_id: id_input, output_class:  output_class, input_class: input_class});
        return true;

      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  removeConnectionNodeId(id) {
    id = this.nodeElementId(id);
    const elems = this.container.querySelectorAll(`.node_out_${id}, .node_in_${id}`);
    for(var i = elems.length-1; i >= 0; i--) {
      var listclass = elems[i].classList;
      this.removeConnectionData(this.module, listclass[2].slice(14), listclass[3], listclass[1].slice(13), listclass[4]);
      elems[i].remove();
      this.dispatch('connectionRemoved', { output_id: listclass[2].slice(14), input_id: listclass[1].slice(13), output_class: listclass[3], input_class: listclass[4] } );
    }
  },
};
