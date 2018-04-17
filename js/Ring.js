class Ring {
  constructor(index, center, innerRadius, thickness, innerSockets = sectors, outerSockets = sectors) {
    this.index = index;
    this.center = center;
    this.innerRadius = innerRadius;
    this.thickness = thickness;
    this.outerRadius = innerRadius + thickness;
    this.middleRadius = innerRadius + thickness/2;
    this.splines = [];
    this.innerRing = null;
    this.outerRing = null;
    this.rotation = 0;
    this.rotationIndex = 0;
    this.rotationMax = sectors;
    this.fillColor = settings.ringFillColor;
    if (typeof innerSockets === 'number') {
      this.innerSockets = this.createSockets(innerSockets, this.innerRadius, sideType.INSIDE);
    } else if (Array.isArray(innerSockets)) {
      this.innerSockets = innerSockets;
    } else {
      this.innerSockets = [];
    }

    if (typeof outerSockets === 'number') {
      this.outerSockets = this.createSockets(outerSockets, this.outerRadius, sideType.OUTSIDE);
    } else if (Array.isArray(outerSockets)) {
      this.outerSockets = outerSockets;
    } else {
      this.outerSockets = [];
    }
  }

  createSockets(count, radius, side) {
    let sockets = [];
    for (let i = 0; i < count; i++) {
      let position = p5.Vector.fromAngle(TWO_PI * i / count).mult(radius)
      let sock = new Socket(this, i, position, side);
      sockets.push(sock);
    }
    return sockets;
  }

  show() {
    this.rotation = this.rotationIndex / this.rotationMax * TWO_PI;
    push();
    translate(this.center.x, this.center.y);
    rotate(this.rotation);
    stroke(this.fillColor);
    strokeWeight(this.thickness);
    ellipse(0,0,this.middleRadius*2,this.middleRadius*2);
    // strokeWeight(0.2);
    // ellipse(0, 0, this.innerRadius * 2, this.innerRadius * 2);
    // ellipse(0, 0, this.outerRadius * 2, this.outerRadius * 2);
    for (let i = 0; i < this.splines.length; i++) {
      this.splines[i].show();
    }
    if (debug) {
      debugger;
      let s = this.sockets;
      for (let i = 0; i < s.length; i++) {
        s[i].show();
      }
      rotate(-this.rotation);
      text(this.rotationIndex, 0, this.index * 10);
    }
    pop();
  }
  get sockets() {
    return concat(this.innerSockets, this.outerSockets.slice().reverse());
  }
  getSocketsOnSide(side) {
    if (side === sideType.INSIDE) {
      return this.innerSockets;
    }
    if (side === sideType.OUTSIDE) {
      return this.outerSockets;
    }
    return this.sockets;
  }
  // setRotationIndex() {
  //   this.rotationIndex = rotationIndex;
  // }
  getRotatedSockets(side) {
    let inside, outside;
    if (side !== sideType.OUTSIDE) {
      let inside = this.innerSockets.slice();
      let shiftInside = inside.splice(0, this.rotationIndex);
      inside = inside.concat(shiftInside);
      if (side === sideType.INSIDE) {
        return inside;
      }
    }
    if (side !== sideType.INSIDE) {
      let outside = this.outerSockets.slice();
      let shiftOutside = outside.splice(0, this.rotationIndex);
      outside = outside.concat(shiftOutside);
      if (side === sideType.OUTSIDE) {
        return outside;
      }
    }
    return concat(inside, outside.reverse());
  }

  getRotatedSocket(index, side) {
    let socks = this.getRotatedSockets(side);
    let i = index % socks.length;
    return socks[i];
  }

  getSocket(index, side) {
    let socks = this.getSocketsOnSide(side);
    let i = index % socks.length;
    return socks[i];
  }


}
