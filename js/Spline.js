class Spline {
  constructor(ring, start, end) {
    this.ring = ring;
    this.start = start;
    this.end = end;
    if (ring.innerSockets.includes(this.start) && ring.innerSockets.includes(this.end)) {
      this.sideType = sideType.INSIDE;
    } else
    if (ring.outerSockets.includes(this.start) && ring.outerSockets.includes(this.end)) {
      this.sideType = sideType.OUTSIDE;
    } else {
      this.sideType = sideType.CROSSING;
    }
    if (this.start.index > this.end.index) {
      let t = this.start;
      this.start = this.end;
      this.end = t;
    }
    this.start.connect(this, 'start');
    this.end.connect(this, 'end');
  }
  show() {
    strokeWeight(2);
    noFill();
    colorMode(HSB);
    // let hue = spline.level * 360 * sectors * 1.5;
    // hue = hue % 360;
    let c = color(this.hue, 100, 75, 50)
    // colorMode(RGB);
    stroke(c);
    this.drawLines();
  }
  drawLines() {
    let startAngle = this.start.position.heading();
    let endAngle = this.end.position.heading();
    let middleRadius = this.ring.innerRadius + (this.ring.outerRadius - this.ring.innerRadius) * this.level;
    let arc1 = this.start.position.copy().setMag(middleRadius);
    let arc2 = this.end.position.copy().setMag(middleRadius);
    line(this.start.position.x, this.start.position.y, arc1.x, arc1.y);
    arc(0, 0, middleRadius * 2, middleRadius * 2, startAngle, endAngle);
    line(arc2.x, arc2.y, this.end.position.x, this.end.position.y);
  }

  otherSocket(socket) {
    if (socket === this.start) {
      return this.end;
    }
    if (socket === this.end) {
      return this.start;
    }
    return null;
  }
}
