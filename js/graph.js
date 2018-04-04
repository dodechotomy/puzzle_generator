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
  var innerSockets = ring.innerSockets;
  var outerSockets = ring.outerSockets;
  var crossings = splines.filter(function(s) {
    return (innerSockets.includes(s.start) && outerSockets.includes(s.end)) ||
      (outerSockets.includes(s.start) && innerSockets.includes(s.end));
  });
  var innerBacktracks = splines.filter(function(s) {
    return innerSockets.includes(s.start) && innerSockets.includes(s.end);
  });
  var outerBacktracks = splines.filter(function(s) {
    return outerSockets.includes(s.start) && outerSockets.includes(s.end);
  });
  findBacktrackTrees(ring, innerSockets, innerBacktracks, splineType.INSIDE);
  findBacktrackTrees(ring, outerSockets, outerBacktracks, splineType.OUTSIDE);

  //Find neighbours for crossings
  for (var i = 0; i < crossings.length; i++) {
    var s = crossings[i];
    if (s.start.index == s.end.index) {
      s.inside = [];
      s.outside = [];
      continue;
    }
    var direction = 1;
    if (innerSockets.includes(s.start)) {
      direction *= -1;
    }
    //Inside neighbours
    var insideNeighbours = scanNeighbours(s, innerSockets, innerBacktracks, crossings);
    insideNeighbours.forEach(function(n) {
      addInside(s, n);
    });
    //Outside neighbours
    // direction *= -1;
    var outsideNeighbours = scanNeighbours(s, outerSockets, outerBacktracks, crossings);
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
        let aliveInside = false;
        let aliveOutside = false;
        if (cross.inside) { aliveInside = cross.inside.some(function(s) {
            return s.alive;
          })
        }
        if (cross.outside) {
          aliveOutside = cross.outside.some(function(s) {
            return s.alive;
          })
        }
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

function scanNeighbours(main, sockets, backtracks, crossings) {
  debugger;
  var start = main.start;
  var end = main.end;
  var targetList = [];
  if (start.index == end.index) {
    return targetList;
  }
  if (end.index < 0 || end.index > sockets.length) {
    return targetList;
  }
  var direction = start.index <= end.index ? 1 : -1;
  for (var i = start.index; i != end.index; i = wrap(i + direction, 0, sockets.length)) {
    // history.push(i);
    var c = sockets[i];
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

function findBacktrackTrees(ring, sockets, splines, side) {
  var remaining = splines.slice();
  while (remaining.length > 0) {
    var s = remaining.pop();
    var contained = [];
    var start = s.start;
    var end = s.end;
    var i = start.index + 1;
    i = wrap(i, 0, sockets.length);
    while (i != end.index) {
      var newSpline = sockets[i].splineByRing(ring);
      if (!newSpline) {
        i = (i + 1) % sockets.length;
      } else {
        contained.push(newSpline);
        i = newSpline.end.index + 1;
      }
      i = wrap(i, 0, sockets.length);
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


function clusterSockets(ring, allowBacktrack = true) {
  var sockets = ring.sockets;
  var clusters = [];
  var splines = [];
  var initialCluster = createInitialCluster(sockets);
  clusters.push(initialCluster);
  if (avoidCycles) {
    var c = clusters.pop();
    var zeroes = c.filter(function(c) {
      return (c.target.index == 0);
    });
    var spline = new Spline(ring, zeroes[0].target, zeroes[1].target);
    splines.push(spline)
    var newClusters = removeAndRecluster(c, zeroes[0], zeroes[1]);
    clusters = clusters.concat(newClusters);
  }
  while (clusters.length > 0) {
    var c = clusters.pop();
    var nodes = pickTwoNodes(c, allowBacktrack);
    var spline = new Spline(ring, nodes[0].target, nodes[1].target);
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

function validateSplines(ring) {
  var valid = true;
  var splines = ring.splines.slice();
  var crossings = splines.filter(x => x.splineType == splineType.CROSSING);
  var inside = splines.filter(x => x.splineType == splineType.INSIDE);
  var outside = splines.filter(x => x.splineType == splineType.OUTSIDE);
  if (splineRequirements.minSplines > 0) {
    valid = valid && (splines.length >= splineRequirements.minSplines);
  }
  if (splineRequirements.maxSplines > 0) {
    valid = valid && (splines.length <= splineRequirements.minSplines);
  }
  if (splineRequirements.notAllCrossings) {
    valid = valid && (crossings.length <= splines.length);
  }
  if (splineRequirements.someCrossings) {
    valid = valid && (crossings.length >= 0);
  }
  return valid;
}
