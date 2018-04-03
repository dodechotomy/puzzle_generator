
class Spline(ring, start, end) {
  constructor(ring, start, end) {
    this.ring = ring;
    this.start = start;
    this.end = end;
    if (ring.innerSockets.includes(this.start) && ring.innerSockets.includes(this.end)) {
      this.splineType = splineType.INSIDE;
    } else
    if (ring.outerSockets.includes(this.start) && ring.outeSockets.includes(this.end)) {
      this.splineType = splineType.OUTSIDE;
    } else {
      this.splineType = splineType.CROSSING;
    }
    if (this.start.index > this.end.index) {
      var t = this.start;
      this.start = this.end;
      this.end = t;
    }
    this.start.spline = spline;
    this.end.spline = spline;
  }
  show() {
    var startAngle = this.start.position.heading();
    var endAngle = this.end.position.heading();
    var middleRadius = this.ring.innerRadius + (this.ring.outerRadius - this.ring.innerRadius) * this.level;
    var arc1 = this.start.position.copy().setMag(middleRadius);
    var arc2 = this.end.position.copy().setMag(middleRadius);
    strokeWeight(2);
    colorMode(HSB);
    // var hue = spline.level * 360 * sectors * 1.5;
    // hue = hue % 360;
    var c = color(this.hue, 100, 75)
    // colorMode(RGB);
    stroke(c);
    line(spline.start.position.x, spline.start.position.y, arc1.x, arc1.y);
    arc(0, 0, middleRadius * 2, middleRadius * 2, startAngle, endAngle);
    line(arc2.x, arc2.y, spline.end.position.x, spline.end.position.y);
  }
  connect(socket) {
    if (socket.innerRing == this.ring) {
      if (socket.splines.hasOwnProperty('outer')) {
        console.log('Overloaded socket!');
        console.log(socket);
        console.log(this);
      }
      socket.splines.outer = this;
    }
    if (socket.outerRing == s.ring) {
      if (socket.splines.hasOwnProperty('inner')) {
        console.log('Overloaded socket!');
        console.log(socket);
        console.log(this);
      }
      socket.splines.inner = this;
    }
  }
}
