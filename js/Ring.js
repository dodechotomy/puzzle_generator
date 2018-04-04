
class Ring {
  constructor(index, center, innerRadius, thickness, innerSockets = sectors, outerSockets = sectors) {
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
    if (typeof innerSockets === 'number') {
      this.innerSockets = this.createSockets(innerSockets, this.innerRadius);
    } else if (Array.isArray(innerSockets)) {
      this.innerSockets = innerSockets;
    } else {
      this.innerSockets = [];
    }

    if (typeof outerSockets === 'number') {
      this.outerSockets = this.createSockets(outerSockets, this.outerRadius);
    } else if (Array.isArray(outerSockets)) {
      this.outerSockets = outerSockets;
    } else {
      this.outerSockets = [];
    }
  }

  createSockets(count, radius) {
    let sockets = [];
    for (var i = 0; i < count; i++) {
      var position = p5.Vector.fromAngle(TWO_PI * i / count).mult(radius)
      let sock = new Socket(i, position, {}, null, this);
      sockets.push(sock);
    }
    return sockets;
  }

  show() {
    push();
    translate(this.center.x, this.center.y);
    rotate(this.rotation);
    stroke('#ED225D');
    strokeWeight(0.2);
    ellipse(0, 0, this.innerRadius * 2, this.innerRadius * 2);
    ellipse(0, 0, this.outerRadius * 2, this.outerRadius * 2);
    for (var i = 0; i < this.splines.length; i++) {
      this.splines[i].show();
    }
    pop();
  }
  get sockets() {
    return concat(this.innerSockets, this.outerSockets.slice().reverse());
  }
}
