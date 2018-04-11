class Ring {
  constructor(index, center, innerRadius, thickness, innerSockets, outerSockets) {
    this.index = index;
    this.center = center;
    this.innerRadius = innerRadius;
    this.thickness = thickness;
    this.outerRadius = innerRadius + thickness;
    this.splines = [];
    this.innerRing = null;
    this.outerRing = null;
    this.rotation = 0;
    this.rotationIndex = 0;

    let count = innerSockets;
    if (Array.isArray(innerSockets)) {
      count = innerSockets.length;
    }
    if (typeof count === 'number') {
      this.innerSockets = this.createSockets(count, this.innerRadius, sideType.INSIDE);
    } else {
      this.innerSockets = [];
    }

    count = outerSockets;
    if (Array.isArray(outerSockets)) {
      count = outerSockets.length;
    }
    if (typeof count === 'number') {
      this.outerSockets = this.createSockets(count, this.outerRadius, sideType.OUTSIDE);
    } else {
      this.outerSockets = [];
    }
    this.rotationMax = this.innerSockets.length || this.outerSockets.length;
  }

  createSockets(count, radius, side) {
    let sockets = [];
    for (let i = 0; i < count; i++) {
      let angle = TWO_PI * i / count;
      let position = p5.Vector.fromAngle(angle).mult(radius)
      let sock = new Socket(this, i, angle, position, side);
      sockets.push(sock);
    }
    return sockets;
  }

  show() {
    this.rotation = this.rotationIndex / this.rotationMax * TWO_PI;
    push();
    translate(this.center.x, this.center.y);
    rotate(this.rotation);
    stroke('#ED225D');
    strokeWeight(0.2);
    ellipse(0, 0, this.innerRadius * 2, this.innerRadius * 2);
    ellipse(0, 0, this.outerRadius * 2, this.outerRadius * 2);
    for (let i = 0; i < this.splines.length; i++) {
      this.splines[i].show();
    }
    if (debug) {
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
    return null;
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
    let i = wrap(index, 0, socks.length);
    return socks[i];
  }
  getSocketByAngle(angle, side) {
    let socks = this.getSocketsOnSide(side);
    let a = angle % TWO_PI;
    let index = round(map(a, 0, TWO_PI, 0, socks.length));
    return socks[index];
  }
  getSocketsInRange(start, end, side) {
    let socks = this.getSocketsOnSide(side);
    let innerRange = function(a) {
      return a >= start && a <= end
    };
    let outerRange = function(a) {
      return a >= start || a <= end
    };
    let cond = start < end ? innerRange : outerRange;
    let inRange = socks.filter(s => cond(s.angle % TWO_PI));
    return inRange;
  }


}
