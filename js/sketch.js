var start = 0;
var rings = [];
var pastRings = [];
var thickness = 50;
var sectors = 20;
var pathCount = 6;
var ringCount = 4;
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
  console.log(key);
  if (key.toLowerCase() == 'n') {
    pastRings.push(rings);
    createRings();
    clear();
    start = millis();
    loop();
  }
  if (key.toLowerCase() == 'p') {
    if (rings.length > 0) {
      rings = pastRings.pop();
      clear();
      start = millis();
      loop();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function createRings() {
  rings = [];
  var prevRing = null;
  for (var i = 0; i < ringCount; i++) {
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
    var start = randomItem(innerConns);
    var outerConns = filterConnectors(r, true, OUTER, start.index);
    var end = randomItem(outerConns);
    makeSpline(r, start, end, (j + 1) / (pathCount + 1));
  }
  for (var i = 1; i < rings.length; i++) {
    for (var j = 0; j < rings[i - 1].splines.length; j++) {
      var s = rings[i - 1].splines[j];
      var start = s.end;
      var outerConns = filterConnectors(rings[i], true, OUTER, start.index);
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
        splines: {},
        innerRing: null,
        outerRing: ring
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
        splines: {},
        innerRing: ring,
        outerRing: null
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

  if (free === true) {
    list = list.filter(function(c) {
      var filled = false;
      if (c.innerRing == ring) {
        if (c.splines.outer) {
          filled = true;
        }
      }
      if (c.outerRing == ring) {
        if (c.splines.inner) {
          filled = true;
        }
      }

      return !filled;
    });
  }
  if (side === INNER) {
    list = list.filter(c => c.outerRing == ring);
  }
  if (side === OUTER) {
    list = list.filter(c => c.innerRing == ring);
  }
}
if (list.length == 0) {
  throw "no valid connections!";
}
return list;
}

function parityFilter(ring, list, conn1) {
  var list = getConnections(ring);

  if (free === true) {
    list = list.filter(function(c) {
      var filled = false;
      if (c.innerRing == ring) {
        if (c.splines.outer) {
          filled = true;
        }
      }
      if (c.outerRing == ring) {
        if (c.splines.inner) {
          filled = true;
        }
      }

      return !filled;
    });
  }

  if (typeof adjacentIndex === 'number') {
    list = list.filter(function(c) {
      var adjacent = (c.index >= adjacentIndex - 1) && (c.index <= adjacentIndex + 1);
      return adjacent;
    });
  }
  if (list.length == 0) {
    throw "no valid connections!";
  }
  return list;
}

function makeSpline(ring, conn1, conn2, level = 0.5) {
  var spline = {
    ring: ring,
    start: conn1,
    end: conn2,
    level: level
  };
  connectSpline(spline, conn1);
  connectSpline(spline, conn2);
  ring.splines.push(spline);
}

function connectSpline(s, c) {
  if (c.innerRing == s.ring) {
    if (c.splines.hasOwnProperty('outer')) {
      console.log('Overloaded connection!');
      console.log(c);
      console.log(s);
    }
    c.splines.outer = s;
  }
  if (c.outerRing == s.ring) {
    if (c.splines.hasOwnProperty('inner')) {
      console.log('Overloaded connection!');
      console.log(c);
      console.log(s);
    }
    c.splines.inner = s;
  }
}

function drawSpline(spline) {
  var ring = spline.ring;
  var startAngle = spline.start.position.heading();
  var endAngle = spline.end.position.heading();
  if (startAngle > endAngle) {
    var t = startAngle;
    startAngle = endAngle;
    endAngle = t;
  }
  if (abs(startAngle - endAngle) > PI) {
    var t = startAngle;
    startAngle = endAngle;
    endAngle = t;
  }
  var middleRadius = ring.innerRadius + (ring.outerRadius - ring.innerRadius) * spline.level;
  var arc1 = spline.start.position.copy().setMag(middleRadius);
  var arc2 = spline.end.position.copy().setMag(middleRadius);
  strokeWeight(2);
  stroke(0, (1 - spline.level) * 255, spline.level * 255);
  line(spline.start.position.x, spline.start.position.y, arc1.x, arc1.y);
  arc(0, 0, middleRadius * 2, middleRadius * 2, startAngle, endAngle);
  line(arc2.x, arc2.y, spline.end.position.x, spline.end.position.y);
}

function createInitialCluster(list) {
  if (list.length < 1) {
    return [];
  }
  var cluster = [];
  var prevNode = null;
  for (var i = 0; i < list.length; i++) {
    var node = {
      target: list[i],
      index: i,
      prev: prevNode,
      next: null
    };
    if (prevNode) {
      prevNode.next = node;
    }
    prevNode = node;
    cluster.push(node);
  }
  prevNode.next = cluster[0];
  cluster[0].prev = prevNode;
  return cluster;
}

function pickTwoNodes(cluster) {
  var node1 = cluster[floor(random(cluster.length))];
  var filteredCluster = cluster.filter(function(n) {
    return (n.index - node1.index) % 2 == 1;
  });
  var node2 = filteredCluster[floor(random(filteredCluster.length))];
  return [node1, node2];
}

function removeAndRecluster(cluster, a, b) {
  var iA = a.prev;
  var oA = a.next;
  var iB = b.prev;
  var oB = b.next;
  iA.next = oB;
  oA.prev = iB;
  iB.next = oA;
  oB.prev = iA;
  remove(cluster, a);
  remove(cluster, b);
  var newClusters = extractClusters(cluster);
}

function remove(array, item) {
  var i = array.indexOf(item);
  if (i == -1) {
    return null;
  }
  array.splice(i, 1);
  return true;
}

function extractClusters(oldCluster) {
  var newClusters = [];
  while (oldCluster.length > 0) {
    var cluster = [];
    var start = oldCluster[0];
    remove(oldCluster, start);
    cluster.push(start)
    var c = start;
    while (c.next && (c.next != start)) {
      remove(oldCluster, c.next);
      cluster.push(c.next)
      c = c.next;
    }
    newClusters.push(cluster);
  }
  return newClusters;
}
