class Socket {
  constructor(ring, index, position, side) {
    this.index = index;
    this.position = position;
    this.spline = null;
    this.ring = ring;
    this.side = side;
  }
  connect(spline) {
    if(this.spline){
      console.log("Overloaded socket!");
    }
      this.spline = spline;
  }
}
