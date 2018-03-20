var start = 0;
var rings = [];
var pastRings = [];
var thickness = 50;
var sectors = 6;
var pathCount = 6;
var ringCount = 1;
var avoidCycles = true;
// var globalSeed = 3551;
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
  noLoop();
}

function keyPressed() {
  // console.log(key);
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
  return concat(ring.innerConnections, ring.outerConnections.slice().reverse());
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
  // if (startAngle > endAngle) {
  //   var t = startAngle;
  //   startAngle = endAngle;
  //   endAngle = t;
  // }
  // if (abs(startAngle - endAngle) > PI) {
  //   var t = startAngle;
  //   startAngle = endAngle;
  //   endAngle = t;
  // }
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
  // debugger;
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
  //assigns levels to the splines in a list in order to avoid overlaps.
  var unassigned = splines.slice();
  var trees = []
  while (unassigned.length > 0) {
    var tree = assignTree(unassigned, unassigned[0]);
    trees.push(tree);
  }
  //adjust levels to fall between 0 and 1 in the whole ring
  var levels = [];
  for (var i = 0; i < trees.length; i++) {
    for (var j = 0; j < trees[i].length; j++) {
      levels.push(trees[i][j].level);
    }
  }
  var minimum = min(levels)-1;
  var maximum = max(levels)+1;
  for (var i = 0; i < trees.length; i++) {
    trees[i].forEach(function(s) {
      s.originalLevel = s.level;
      s.level = map(s.level, minimum, maximum, 0, 1);
    })
  }
}

function assignTree(list, root, level = 0, depth = 0) {
  var tree = [root];
  if (list.length > 0 && depth > list.length * 10) {
    throw "Infinite loop?";
  }
  //finds a tree embedded in the list and recursively assigns levels to its nodes
  if (!list.includes(root)) {
    return null;
  }
  removeItem(list, root);
  if (depth == 0) {
    if (root.start.innerRing && root.start.innerRing === root.end.innerRing) {
      level++;
    }
  }
  root.level = level;
  if (list.length > 0 && root.inside) {
    root.inside.forEach(function(t) {
      var branch = assignTree(list, t, level - 1, depth + 1);
      if (branch) {
        tree = tree.concat(branch);
      } else {
        // debugger;
      }
    });
  }
  if (list.length > 0 && root.outside) {
    root.outside.forEach(function(t) {
      var branch = assignTree(list, t, level + 1, depth + 1);
      if (branch) {
        tree = tree.concat(branch);
      } else {
        // debugger;
      }
    });
  }
  if (tree.length == 0) {
    // debugger;
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
    end: end,
    level: 0
  };
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
  findBacktrackTrees(innerConnections, innerBacktracks, INNER);
  findBacktrackTrees(outerConnections, outerBacktracks, OUTER);

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
    s.inside = scanNeighbours(s, innerConnections, innerBacktracks, crossings);
    for (var j = 0; j < s.inside.length; j++) {
      if (!s.inside[j].outside) {
        s.inside[j].outside = [];
      }
      var o = s.inside[j].outside;
      if (!o.includes(s)) {
        o.push(s);
      }
    }
    //Outside neighbours
    direction *= -1;
    s.outside = scanNeighbours(s, outerConnections, outerBacktracks, crossings);
    for (var j = 0; j < s.outside.length; j++) {
      if (!s.outside[j].inside) {
        s.outside[j].inside = [];
      }
      var o = s.outside[j].inside;
      if (!o.includes(s)) {
        o.push(s);
      }
    }
  }
  //find cycles
  var leftAlive = [];
  if (checkCycles) {
    crossings.forEach(function(s) {
      s.alive = true;
    });
    var pruned = 1;
    while (pruned > 0) {
      // debugger;
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
  var start = main.start;
  var end = main.end;
  var targetList = [];
  if (start.index == end.index) {
    return targetList;
  }
  var direction = start.index <= end.index ? 1 : -1;
  var j = start.index;
  j = wrap(j, 0, connections.length);
  var history = [];
  while (j != end.index) {
    history.push(j);
    if (history.length > 100000) {
      debugger;
      // throw "While loop taking forever!";
    }
    var c = connections[j];
    if (c == main) {
      continue;
    }
    if (c.spline && backtracks.includes(c.spline)) {
      targetList.push(c.spline);
      if (direction == -1) {
        j = min(c.spline.start.index, c.spline.end.index);
      } else {
        j = max(c.spline.start.index, c.spline.end.index);
      }
    }
    if (c.spline && crossings.includes(c.spline)) {
      if (c.spline.start.index == c.spline.end.index) {
        debugger;
      }
      targetList.push(c.spline);
      break;
    }
    if (j == end.index) {
      break;
    }
    if ((j < end.index && direction < 0) || (j > end.index && direction > 0)) {
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
  var remaining = splines.slice();
  // debugger;
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
      s.outside = [];
    } else {
      s.inside = [];
      s.outside = contained;
    }
  }
  // debugger;
  return splines;
  //TODO Fix this infinite loop issue
}
