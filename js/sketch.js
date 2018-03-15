var start = 0;
var rings = [];
var pastRings = [];
var thickness = 50;
var sectors = 40;
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
      for (var j = 0; j < prevRing.outerConnections.length; j++) {
        prevRing.outerConnections[j].outerRing = r;
      }
    }
    rings.push(r);
    prevRing = r;
  }

  for (var i = 0; i < rings.length; i++) {
    var r = rings[i];
    r.splines = clusterConnections(r);
    // r.blag.glaf = r.glad.gewc;
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
  } else if (Array.isArray(innerConnections)) {
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
  } else if (Array.isArray(outerConnections)) {
    ring.outerConnections = outerConnections;
  }
  return ring;
}

function getConnections(ring) {
  return concat(ring.innerConnections, ring.outerConnections);
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

function clusterConnections(ring, allowBacktrack = true) {
  var connections = getConnections(ring);
  var clusters = [];
  var splines = [];
  var initialCluster = createInitialCluster(connections);
  clusters.push(initialCluster);
  while (clusters.length > 0) {
    var c = clusters.pop();
    var nodes = pickTwoNodes(c, allowBacktrack);
    var spline = makeSpline(ring, nodes[0].target, nodes[1].target);
    splines.push(spline)
    var newClusters = removeAndRecluster(c, nodes[0], nodes[1]);
    clusters = clusters.concat(newClusters);
  }
  var cycles = shadowGraph(ring, splines, true);
  if (cycles) {
    console.log("Generated with cycles! unable to assign levels.")
    splines.forEach(x => (x.level = random()));
  } else {
    assignLevels(splines);
  }
  return splines;
}

function assignLevels(splines) {
  //assigns levels to the splines in a list in order to avoid overlaps.
  var unassigned = splines.copy();
  var trees = []
  while (unassigned.length > 0) {
    var tree = assignTree(unassigned, unassigned[0]);
    trees.push(tree);
  }
  //adjust levels to fall between 0 and 1 in each tree
  for (var i = 0; i < trees.length; i++) {
    var levels = trees[i].map(s => s.level);
    var min = min(levels);
    var max = max(levels);
    trees[i].forEach(function(s) {
      s.level = map(s.level, min - 1, max + 1, 0, 1);
    })
  }
}

function assignTree(list, root, level = 0, depth = 0) {
  if (depth > list.length * 10) {
    throw "Infinite loop?";
  }
  //finds a tree embedded in the list and recursively assigns levels to its nodes
  if (!list.includes(root)) {
    return null;
  }
  list.removeItem(root);
  root.level = level;
  root.inside.forEach(function(t) {
    assignTree(list, t, level + 1, depth + 1);
  });
  root.outside.forEach(function(t) {
    assignTree(list, t, level - 1, depth + 1);
  });
  return root;
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

function makeSpline(ring, start, end) {
  var spline = {
    ring: ring,
    start: start,
    end: end,
    level: 0.5
  };
  if(spline.start.index > spline.end.index){
    var t = spline.start;
    spline.start = spline.end;
    spline.end = t;
  }
  start.spline = spline;
  end.spline = spline;
  return spline;
}

function pickTwoNodes(cluster, allowBacktrack) {
  var node1 = cluster[floor(random(cluster.length))];
  var filteredCluster = cluster.filter(function(n) {
    var diff = abs((n.index - node1.index)) % 2
    return diff == 1
  });
  if (!allowBacktrack) {
    filteredCluster = filteredCluster.filter(function(n) {
      var matchInner = n.innerRing && (n.innerRing == node1.innerRing);
      var matchOuter = n.outerRing && (n.outerRing == node1.outerRing);
      return !(matchInner || matchOuter);
    });
  }
  var node2 = filteredCluster[floor(random(filteredCluster.length))];
  return [node1, node2];
}

function removeItem(array, item) {
  var i = array.indexOf(item);
  if (i == -1) {
    return null;
  }
  array.splice(i, 1);
  return true;
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
  removeItem(cluster, a);
  removeItem(cluster, b);
  var newClusters = extractClusters(cluster);
  return newClusters;
}


function extractClusters(oldCluster) {
  var newClusters = [];
  while (oldCluster.length > 0) {
    var cluster = [];
    var start = oldCluster[0];
    removeItem(oldCluster, start);
    cluster.push(start)
    var c = start;
    while (c.next && (c.next != start)) {
      removeItem(oldCluster, c.next);
      cluster.push(c.next)
      c = c.next;
    }
    newClusters.push(cluster);
  }
  return newClusters;
}

function shadowGraph(ring, splines, checkCycles = true) {
  var innerConnections = ring.innerConnections;
  var outerConnections = ring.outerConnections;
  var crossings = splines.filter(function(s) {
    return (innerConnections.includes(s.start) && outerConnections.includes(s.end)) ||
      (outerConnections.includes(s.start) && innerConnections.includes(s.end));
  });
  var innerBacktracks = splines.filter(function(s) {
    return innerConnections.includes(s.start) && innerConnections.includes(s.end);
  });
  var outerBacktracks = splines.filter(function(s) {
    return outerConnections.includes(s.start) && outerConnections.includes(s.end);
  });
  findBacktrackTrees(innerConnections, innerBacktracks, INNER);
  findBacktrackTrees(outerConnections, outerBacktracks, OUTER);

  //Find neighbours for crossings
  for (var i = 0; i < crossings.length; i++) {
    var s = crossings[i];
    var direction = 1;
    if (innerConnections.includes(s.start)) {
      direction *= -1;
    }
    //Inside neighbours
    s.inside = scanNeighbours(direction, s.start, s.end, innerConnections, innerBacktracks, crossings);
    //Outside neighbours
    direction *= -1;
    s.outside = scanNeighbours(direction, s.end, s.start, outerConnections, outerBacktracks, crossings);
  }
  //find cycles
  var noCycles = true;
  if (checkCycles) {
    crossings.forEach(function(s) {
      s.alive = true;
    });
    var pruned = 1;
    while (pruned > 0) {
      crossings.forEach(function(cross) {
        var aliveInside = cross.inside.some(function(s) {
          return s.alive;
        })
        var aliveOutside = cross.outside.some(function(s) {
          return s.alive;
        })
        cross.stillAlive = aliveInside && aliveOutside;
      });
      pruned = 0;
      crossings.forEach(function(cross) {
        if (cross.alive && !cross.stillAlive) {
          pruned++;
        }
        cross.alive = cross.stillAlive;
      });
    }
    var leftAlive = crossings.filter(cross => cross.alive).length;
    noCycles = leftAlive == 0;
  }
  return noCycles;
}

function scanNeighbours(direction, from, to, connections, backtracks, crossings) {
  var targetList = [];
  var j = from.index + direction;
  j = wrap(j, 0, connections.length);
  while (j != to.index) {
    var c = connections[j];
    if (c.spline && backtracks.includes(c.spline)) {
      targetList.push(c.spline);
      if (direction == -1) {
        j = c.spline.start.index - 1;
      } else {
        j = c.spline.end.index + 1;
      }
    }
    if (c.spline && crossings.includes(c.spline)) {
      targetList.push(c.spline);
      break;
    }
    j += direction;
    j = wrap(j, 0, connections.length);
  }
  return targetList;
}

function wrap(n, s, e) {
  if (n < s) {
    n = e + n;
  }
  if (n >= e) {
    n = n - e;
  }
  return n;
}

function findBacktrackTrees(connections, splines, side) {
  debugger;
  var remaining = splines.slice();
  while (remaining.length > 0) {
    var s = remaining.pop();
    var contained = [];
    var start = s.start;
    var end = s.end;
    var i = start.index + 1;
    i = wrap(i, 0, connections.length);
    while (i != end.index) {
      var newSpline = connections[i].spline;
      if (!newSpline) {
        i = (i + 1) % connections.length;
      } else {
        contained.push(newSpline);
        i = newSpline.end.index + 1;
      }
      i = wrap(i, 0, connections.length);
    }
    if (side == INNER) {
      s.inside = contained;
    } else {
      s.outside = contained;
    }
  }
  debugger;
  return splines;
}
