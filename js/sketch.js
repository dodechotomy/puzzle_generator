var start = 0;
var rings = [];
var pastRings = [];
var thickness = 76;
var sectors = Math.floor(Math.random()*7+2)*2;
var pathCount = 6;
var ringCount = 4;
var avoidCycles = false;
var speed = 0.01;
var delay = 250;
var lastMoved = 0;
var moving = true;
var movingRing = 0;
var lastPos = 0;
var target = Math.PI*2 / sectors;
// var globalSeed = 8779;
var trees = [];
const splineType = {
  INSIDE: -1,
  OUTSIDE: 1,
  CROSSING: 0
}

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
  if (moving) {
    moveRing()
  } else {
    if (millis() - lastMoved > delay) {
      moving = true;
      lastMoved = millis();
    }
  }
  for (var i = 0; i < rings.length; i++) {
    drawRing(rings[i]);
  }
  // noLoop();
}

function moveRing() {
  var r = rings[movingRing];
  var f = (millis() - lastMoved) / delay;
  var currentRot = map(f, 0, 1, lastPos, lastPos+target);
  r.rotation = currentRot;
  if (f > 1) {
    r.rotation = lastPos+target;
    lastMoved = millis();
    moving = false;
    movingRing++;
    movingRing = movingRing % rings.length;
    var d = TWO_PI / sectors;
    d *= (random() < 0.5) ? 1 : -1;
    d *= (random() < 0.25) ? 2 : 1;
    d *= (random() < 0.125) ? 3 : 1;
    rings[movingRing].rotation = rings[movingRing].rotation % TWO_PI;
    target = d;
    lastPos = rings[movingRing].rotation;
  }
}

function keyPressed() {
  // console.log(key);
  if (key.toLowerCase() == 'n') {
    // sectors = Math.floor(Math.random()*4+1)*2;
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
  if (typeof globalSeed == 'number') {
    randomSeed(globalSeed);
  } else {
    var seed = floor(millis());
    console.log("seed: " + seed);
    randomSeed(seed);
  }
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
    if (i == ringCount - 1) {
      outerConnections = 0;
    }
    if (i == 0) {
      innerConnections = 0;
    }
    var r = makeRing(i, c, innerRadius, thickness, innerConnections, outerConnections);
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

function makeRing(index, center, innerRadius, thickness, innerConnections = sectors, outerConnections = sectors) {
  var ring = {
    index: index,
    center: center,
    innerRadius: innerRadius,
    thickness: thickness,
    outerRadius: innerRadius + thickness,
    splines: [],
    innerRing: null,
    outerRing: null,
    innerConnections: [],
    outerConnections: [],
    rotation: 0
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
  return concat(ring.innerConnections, ring.outerConnections.slice().reverse());
}

function drawRing(ring) {
  push();
  translate(ring.center.x, ring.center.y);
  rotate(ring.rotation);
  stroke('#ED225D');
  strokeWeight(0.2);
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
  var middleRadius = ring.innerRadius + (ring.outerRadius - ring.innerRadius) * spline.level;
  var arc1 = spline.start.position.copy().setMag(middleRadius);
  var arc2 = spline.end.position.copy().setMag(middleRadius);
  strokeWeight(2);
  colorMode(HSB);
  // var hue = spline.level * 360 * sectors * 1.5;
  // hue = hue % 360;
  var c = color(spline.hue, 100, 75)
  // colorMode(RGB);
  stroke(c);
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
  if (avoidCycles) {
    var c = clusters.pop();
    var zeroes = c.filter(function(c) {
      return (c.target.index == 0);
    });
    var spline = makeSpline(ring, zeroes[0].target, zeroes[1].target);
    splines.push(spline)
    var newClusters = removeAndRecluster(c, zeroes[0], zeroes[1]);
    clusters = clusters.concat(newClusters);
  }
  while (clusters.length > 0) {
    var c = clusters.pop();
    var nodes = pickTwoNodes(c, allowBacktrack);
    var spline = makeSpline(ring, nodes[0].target, nodes[1].target);
    splines.push(spline)
    var newClusters = removeAndRecluster(c, nodes[0], nodes[1]);
    clusters = clusters.concat(newClusters);
  }
  var cycles = shadowGraph(ring, splines, true);
  if (cycles.length > 0) {
    console.log("Generated with cycles! unable to properly assign levels.")
    for (var i = 0; i < splines.length; i++) {
      splines[i].level = (i + 1) / (splines.length + 1);
    }
    console.log(cycles);
    // splines.forEach(x => (x.level = 0));
  } else {
    assignLevels(splines);
  }
  return splines;
}

function assignLevels(splines) {
  debugger;
  //assigns levels to the splines in a list in order to avoid overlaps.
  // var unassigned = splines.slice();
  for (var i = 0; i < splines.length; i++) {
    splines[i].inTree = assignInwards(splines[i]);
  }
  for (var i = 0; i < splines.length; i++) {
    splines[i].outTree = assignOutwards(splines[i]);
  }
  //adjust levels to fall between 0 and 1 in the whole ring
  var dLevels = [];
  for (var i = 0; i < splines.length; i++) {
    if (!dLevels.includes(splines[i].level)) {
      dLevels.push(splines[i].level);
    }
  }
  dLevels = dLevels.sort((a, b) => {
    return a - b;
  })
  for (var i = 0; i < splines.length; i++) {
    splines[i].level = dLevels.indexOf(splines[i].level);
  }
  var levels = splines.map((s) => {
    return s.level;
  });
  // var distributedLevels = levels.map()
  // for (var i = 0; i < splines.length; i++) {
  //   levels.push(splines[i].level);
  // }
  var minimum = min(levels) - 1;
  var maximum = max(levels) + 1;
  splines.forEach(function(s) {
    s.originalLevel = s.level;
    s.level = map(s.level, minimum, maximum, 0, 1);
    s.hue = s.level * 360;
  });
}

function addInside(a, b) {
  a.inside = a.inside || [];
  b.outside = b.outside || [];
  if (a == b) {
    return false;
  }
  if (a.inside.includes(b)) {
    return false;
  } else {
    a.inside.push(b);
    b.outside.push(a);
    return true;
  }
}

function removeInside(a, b) {
  a.inside = a.inside || [];
  b.outside = b.outside || [];
  if (!a.inside.includes(b)) {
    return false;
  } else {
    removeItem(a.inside, b);
    removeItem(b.outside, a);
    return true;
  }
}

function assignOutwards(root, level = 0, depth = 0) {
  var tree = [];
  root.outside = root.outside || [];
  if (typeof root.level !== 'number') {
    root.level = level;
  }
  if (root.splineType == splineType.OUTSIDE) {
    debugger;
    root.level = max(level + 100, root.level);
  }
  root.level = max(root.level, level);
  root.outside.forEach(function(t) {
    var branch = assignOutwards(t, root.level + 1, depth + 1);
    if (branch) {
      tree = tree.concat(branch);
    }
  });
  if (depth > 0 && tree.length == 0) {
    tree = [root];
  }
  return tree;
}

function assignInwards(root, level = 0, depth = 0) {
  var tree = [];
  root.inside = root.inside || [];
  if (typeof root.level !== 'number') {
    root.level = level;
  }
  if (root.splineType == splineType.INSIDE) {
    debugger;
    root.level = min(level - 100, root.level);
  }
  root.level = min(root.level, level);
  root.inside.forEach(function(t) {
    var branch = assignInwards(t, root.level - 1, depth + 1);
    if (branch) {
      tree = tree.concat(branch);
    }
  });
  if (depth > 0 && tree.length == 0) {
    tree = [root];
  }
  return tree;
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
    end: end
  };
  if (ring.innerConnections.includes(start) && ring.innerConnections.includes(end)) {
    spline.splineType = splineType.INSIDE;
  } else
  if (ring.outerConnections.includes(start) && ring.outerConnections.includes(end)) {
    spline.splineType = splineType.OUTSIDE;
  } else {
    spline.splineType = splineType.CROSSING;
  }
  if (spline.start.index > spline.end.index) {
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
  findBacktrackTrees(innerConnections, innerBacktracks, splineType.INSIDE);
  findBacktrackTrees(outerConnections, outerBacktracks, splineType.OUTSIDE);

  //Find neighbours for crossings
  for (var i = 0; i < crossings.length; i++) {
    var s = crossings[i];
    if (s.start.index == s.end.index) {
      s.inside = [];
      s.outside = [];
      continue;
    }
    var direction = 1;
    if (innerConnections.includes(s.start)) {
      direction *= -1;
    }
    //Inside neighbours
    var insideNeighbours = scanNeighbours(s, innerConnections, innerBacktracks, crossings);
    insideNeighbours.forEach(function(n) {
      addInside(s, n);
    });
    //Outside neighbours
    // direction *= -1;
    var outsideNeighbours = scanNeighbours(s, outerConnections, outerBacktracks, crossings);
    outsideNeighbours.forEach(function(n) {
      addInside(n, s);
    });
  }
  //find cycles
  var leftAlive = [];
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
    leftAlive = crossings.filter(cross => cross.alive);
  }
  return leftAlive;
}

function scanNeighbours(main, connections, backtracks, crossings) {
  debugger;
  var start = main.start;
  var end = main.end;
  var targetList = [];
  if (start.index == end.index) {
    return targetList;
  }
  if (end.index < 0 || end.index > connections.length) {
    return targetList;
  }
  var direction = start.index <= end.index ? 1 : -1;
  for (var i = start.index; i != end.index; i = wrap(i + direction, 0, connections.length)) {
    // history.push(i);
    var c = connections[i];
    if (c == main) {
      continue;
    }
    if (c.spline && backtracks.includes(c.spline)) {
      targetList.push(c.spline);
    }
    if (c.spline && c.spline.splineType == splineType.CROSSING) {
      targetList.push(c.spline);
    }
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
    for (var i = 0; i < contained.length; i++) {
      if (side == splineType.INSIDE) {
        addInside(s, contained[i]);
      } else {
        addInside(contained[i], s);
      }
    }
  }
  return splines;
  //TODO Fix this infinite loop issue
}
