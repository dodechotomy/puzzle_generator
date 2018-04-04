class Socket {
  constructor(index, position, innerSpline, outerSpline, innerRing, outerRing) {
    this.index = index;
    this.position = position;
    this.innerSpline = innerSpline;
    this.outerSpline = outerSpline;
    this.innerRing = innerRing;
    this.outerRing = outerRing;
  }
  otherSpline(spline) {
    if (spline === this.innerSpline) {
      return this.outerSpline;
    }
    if (spline === this.outerSpline) {
      return this.innerSpline;
    }
    return null;
  }
  splineByRing(ring){
    if (this.innerRing && ring === this.innerRing) {
      return this.innerSpline;
    }
    if (this.outerRing && ring === this.outerRing) {
      return this.outerSpline;
    }
  }
  connect(spline) {
    if (this.innerRing && spline.ring === this.innerRing) {
      this.innerSpline = spline;
    }
    if (this.outerRing && spline.ring === this.outerRing) {
      this.outerSpline = spline;
    }
  }
}
