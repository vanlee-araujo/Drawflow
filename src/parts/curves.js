// Shape of the connection lines
export default {
  createCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type) {
    if(this.connection_direction === 'vertical') {
      // Same curve with the axes swapped: leaves the output downwards and enters the input from above
      var swapped = this.createCurvatureHorizontal(start_pos_y, start_pos_x, end_pos_y, end_pos_x, curvature_value, type);
      return swapped.replace(/(-?[\d.e+-]+)\s+(-?[\d.e+-]+)/g, '$2 $1');
    }
    return this.createCurvatureHorizontal(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type);
  },

  createCurvatureHorizontal(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type) {
    var line_x = start_pos_x;
    var line_y = start_pos_y;
    var x = end_pos_x;
    var y = end_pos_y;
    var curvature = curvature_value;
    //type openclose open close other
    switch (type) {
      case 'open':
        if(start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * (curvature*-1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;

        break
      case 'close':
        if(start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature*-1);
          var hx2 = x - Math.abs(x - line_x) * curvature;
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;
        break;
      case 'other':
        if(start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature*-1);
          var hx2 = x - Math.abs(x - line_x) * (curvature*-1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;
        break;
      default:
        if(this.curvature_backward && end_pos_x < start_pos_x) {
          return this.createBackwardCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y);
        }

        var hx1 = line_x + Math.abs(x - line_x) * curvature;
        var hx2 = x - Math.abs(x - line_x) * curvature;

        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;
    }

  },

  // Connection to a node on the left: loop out to the right, around and into the input from the left
  createBackwardCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y) {
    const dx = start_pos_x - end_pos_x;
    const mid_x = (start_pos_x + end_pos_x) / 2;
    // Different rows: cross through the gap. Same row: pass below, deeper when longer so loops don't overlap
    const mid_y = Math.abs(end_pos_y - start_pos_y) >= this.backward_row_gap
      ? (start_pos_y + end_pos_y) / 2
      : Math.max(start_pos_y, end_pos_y) + this.backward_depth + dx * 0.1;
    const out_x = start_pos_x + this.backward_offset;
    const in_x = end_pos_x - this.backward_offset;
    return ' M '+ start_pos_x +' '+ start_pos_y +' C '+ out_x +' '+ start_pos_y +' '+ out_x +' '+ mid_y +' '+ mid_x +' '+ mid_y +
           ' C '+ in_x +' '+ mid_y +' '+ in_x +' '+ end_pos_y +' '+ end_pos_x +' '+ end_pos_y;
  },
};
