class Socket {
  constructor(ring, index, position, side) {
    this.index = index;
    this.position = position;
    this.spline = null;
    this.ring = ring;
    this.side = side;
    this.type = '';
  }
  connect(spline, startOrEnd) {
    if(this.spline){
      console.log("Overloaded socket!");
    }
      this.spline = spline;
      this.type = startOrEnd;
  }
  get siblings(){
    return this.ring.getSocketsOnSide(this.side);
  }
  get rotatedIndex(){
    return (this.index + this.ring.rotationIndex) % this.siblings.length;
  }
  show(){
    // noFill();
    stroke(255,126,0);
    strokeWeight(1);
    textAlign(CENTER);
    push();
    translate(this.position.x,this.position.y);
    let heading = this.position.heading();
    rotate(heading);
    if(this.side == sideType.INNER){
      // arc(0,0,15,15,-PI/2,PI/2);
      rotate(PI/2);
    }
    if(this.side == sideType.OUTER){
      // arc(0,0,15,15,PI/2,3*PI/2);
      rotate(3*PI/2);
    }
    text(this.type+":"+this.index,0,-2);
    pop();
  }
}
