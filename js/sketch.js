var start = 0;
var rings = [];
var thickness = 50;
var sectors = 6;
var pathCount = 2;
const INNER = 0,
  OUTER = 1;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, SVG); // Create SVG Canvas
  start = millis();
  createRings();
}

function draw() {
  clear();
  strokeWeight(2);
  stroke('#ED225D');
  noFill();
  for (var i = 0; i < rings.length; i++) {
    drawRing(rings[i]);
  }
}

function keyPressed() {
  clear();
  createRings();
  start = millis();
  loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function createRings() {
  rings = [];
  var prevRing = null;
  for (var i = 0; i < 4; i++) {
    var c = createVector(width / 2, height / 2);
    var innerRadius = thickness * (i + 1);
    var innerConnections = sectors;
    if (r) {
      innerConnections = r.outerConnections;
    }
    var outerConnections = sectors;
    var r = makeRing(c, innerRadius, thickness, innerConnections, outerConnections);
    r.innerRing = prevRing;
    if (prevRing) {
      prevRing.outerRing = r;
    }
    rings.push(r);
    prevRing = r;
  }
  for (var j = 0; j < pathCount; j++) {
    var r = rings[0];
    var innerConns = filterConnectors(r, true, INNER);
    var outerConns = filterConnectors(r, true, OUTER);
    var start = randomItem(innerConns);
    var end = randomItem(outerConns);
    makeSpline(r, start, end, (j+1)/(pathCount+1));
    // r.splines.push(s);
  }
  for(var i = 1; i < rings.length;i++){
    for(var j =0; j < rings[i-1].splines.length;j++){
      var s = rings[i-1].splines[j];
      var start = s.end;
      var outerConns = filterConnectors(rings[i], true, OUTER);
      var end = randomItem(outerConns);
      makeSpline(rings[i], start, end, s.level);
    }
  }
}

function makeRing(center, innerRadius, thickness, innerConnections = sectors, outerConnections = sectors) {
  var ring = {
    center: center,
    innerRadius: innerRadius,
    thickness: thickness,
    outerRadius: innerRadius + thickness,
    splines: [],
    innerRing: null,
    outerRing: null,
    innerConnections: [],
    outerConnections: []
  };
  if (typeof innerConnections === 'number') {
    for (var i = 0; i < innerConnections; i++) {
      var position = p5.Vector.fromAngle(TWO_PI * i / innerConnections).mult(ring.innerRadius)
      ring.innerConnections.push({
        index: i,
        position: position,
        splines: []
      });
    }
  } else if (typeof innerConnections === 'array') {
    ring.innerConnections = innerConnections;
  }
  if (typeof outerConnections === 'number') {
    for (var i = 0; i < outerConnections; i++) {
      var position = p5.Vector.fromAngle(TWO_PI * i / outerConnections).mult(ring.outerRadius);
      ring.outerConnections.push({
        index: i,
        position: position,
        splines: []
      });
    }
  } else if (typeof outerConnections === 'array') {
    ring.outerConnections = outerConnections;
  }
  return ring;
}

function getConnections(ring) {
  return concat(ring.innerConnections, ring.outerConnections);
}

function randomItem(array) {
  var rand = random();
  return array[Math.floor(rand * array.length)];
}

function drawRing(ring) {
  push();
  translate(ring.center.x, ring.center.y);
  stroke('#ED225D');
  ellipse(0, 0, ring.innerRadius * 2, ring.innerRadius * 2);
  ellipse(0, 0, ring.outerRadius * 2, ring.outerRadius * 2);
  for (var i = 0; i < ring.splines.length; i++) {
    drawSpline(ring.splines[i]);
  }
  pop();
}

function filterConnectors(ring, free, side) {
  var list = getConnections(ring);
  if (side === INNER) {
    list = ring.innerConnections;
  }
  if (side === OUTER) {
    list = ring.outerConnections;
  }

  if (typeof free === 'boolean') {
    list = list.filter(conn => (conn.target == null) == free)
  }
  return Array.from(list);
}

function makeSpline(ring, conn1, conn2, level = 0.5) {
  var spline = {
    ring: ring,
    start: conn1,
    end: conn2,
    level: level
  };
  conn1.splines.push(spline);
  conn2.splines.push(spline);
  ring.splines.push(spline);
}

function drawSpline(spline) {
  var ring = spline.ring;
  var innerAngle = spline.start.position.heading();
  var outerAngle = spline.end.position.heading();
  if(outerAngle<innerAngle){
    var t = outerAngle;
    outerAngle = innerAngle;
    innerAngle = t;
  }
  var middleRadius = ring.innerRadius + (ring.outerRadius - ring.innerRadius) * spline.level;
  var arc1 = spline.start.position.copy().setMag(middleRadius);
  var arc2 = spline.end.position.copy().setMag(middleRadius);
  strokeWeight(2);
  stroke("blue");
  line(spline.start.position.x, spline.start.position.y, arc1.x, arc1.y);
  arc(0, 0, middleRadius * 2, middleRadius * 2, innerAngle, outerAngle);
  line(arc2.x, arc2.y, spline.end.position.x, spline.end.position.y);
}

function useConnection(ring, conn) {
  var i = ring.freeConnections.inner.indexOf(conn);
  if (i >= 0) {
    ring.freeConnections.inner.splice(i, 1);
    ring.usedConnections.inner.push(conn);
  }
  i = ring.freeConnections.outer.indexOf(conn);
  if (i >= 0) {
    ring.freeConnections.outer.splice(i, 1);
    ring.usedConnections.outer.push(conn);
  }
}
