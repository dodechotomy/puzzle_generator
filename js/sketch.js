var start = 0;
var rings = [];
var thickness = 50;
var sectors = 4;
var pathCount = 2;
const INNER = 0, OUTER = 1;

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
    var r = makeRing(c, innerRadius, thickness, sectors, sectors);
    r.innerRing = prevRing;
    if (prevRing) {
      prevRing.outerRing = r;
    }
    rings.push(r);
    prevRing = r;
  }
  for (var j = 0; j < pathCount; j++) {
    var r = rings[0];
    var start = randomConnector(r.connections, true, INNER);
    var end = randomConnector(r.connections, true, OUTER);
    var s = makeSpline(r, start, end);
    r.splines.push(s);
  }
  for (var i = 1; i < rings.length; i++) {
    for (var j = 0; j < array.length; j++) {
      array[j]
    }
  }
}

function makeRing(center, innerRadius, thickness, innerConnections, outerConnectionCount) {
  var ring = {};
  ring.center = center;
  ring.innerRadius = innerRadius;
  ring.thickness = thickness;
  // ring.middleRadius = ring.innerRadius + (thickness / 2);
  ring.outerRadius = ring.innerRadius + thickness;
  ring.splines = [];
  ring.innerRing = null;
  ring.outerRing = null;
  ring.connections = innerConnections;
  var outerConnections = [];
  for (var i = 0; i < ring.outerConnectionCount; i++) {
    var position = p5.Vector.fromAngle(TWO_PI*i/ring.outerConnectionCount).mult(ring.outerRadius).add(ring.center);
    outerConnections.outer.push({
      index: i,
      position: position,
      splines: []
    });
  }
  return ring;
}

function drawRing(ring) {
  stroke('#ED225D');
  ellipse(ring.center.x, ring.center.y, ring.innerRadius * 2, ring.innerRadius * 2);
  ellipse(ring.center.x, ring.center.y, ring.outerRadius * 2, ring.outerRadius * 2);
  for (var i = 0; i < ring.splines.length; i++) {
    drawSpline(ring.splines[i]);
  }
}

function randomConnector(list, free, side) {
  filtered = list;
  if(typeof free === 'boolean'){
    filtered = filtered.filter(conn => (conn.target == null) == free)
  }
  if(typeof side === 'number'){
    filtered = filtered.filter(conn => conn.side == side)
  }
  return list[floor(random(list.length))];
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
  var innerAngle = spline.inner / ring.innerDivisions * TWO_PI;
  var outerAngle = spline.outer / ring.outerDivisions * TWO_PI;
  var middleRadius = ring.innerRadius + (ring.outerRadius - ring.innerRadius) * spline.level;
  var points = [];
  points.push(p5.Vector.fromAngle(innerAngle).mult(ring.innerRadius));
  points.push(p5.Vector.fromAngle(innerAngle).mult(middleRadius));
  points.push(p5.Vector.fromAngle(outerAngle).mult(middleRadius));
  points.push(p5.Vector.fromAngle(outerAngle).mult(ring.outerRadius));
  points.forEach(function(p) {
    p.add(ring.center);
  })
  strokeWeight(6);
  stroke("white");
  line(points[0].x, points[0].y, points[1].x, points[1].y);
  arc(ring.center.x, ring.center.y, middleRadius * 2, middleRadius * 2, innerAngle, outerAngle);
  line(points[2].x, points[2].y, points[3].x, points[3].y);

  strokeWeight(2);
  stroke("blue");
  line(points[0].x, points[0].y, points[1].x, points[1].y);
  arc(ring.center.x, ring.center.y, middleRadius * 2, middleRadius * 2, innerAngle, outerAngle);
  line(points[2].x, points[2].y, points[3].x, points[3].y);
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
