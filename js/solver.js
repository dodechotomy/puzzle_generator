function findSolutions(rings) {
  validSolutions = checkSubSolutions(rings, 1);
}

function checkSubSolutions(rings, ringIndex) {
  if (ringIndex >= rings.length) {
    return false;
  }
  let ring = rings[ringIndex];
  let socks;
  if (ring.outerSockets && ring.outerSockets.length > 0) {
    socks = ring.outerSockets;
  } else if (ring.innerSockets && ring.innerSockets.length > 0) {
    socks = ring.innerSockets;
  } else {
    debugger; //Ring with no sockets?
    return [];
  }
  // let socks = ring.outerSockets || ring.innerSockets || [];
  let solutions = [];
  for (let i = 0; i < socks.length; i++) {
    ring.rotationIndex = i;
    if (ringIndex == rings.length - 1) {
      let solution = checkSingleSolution(rings);
      if (solution.solved) {
        debugger;
        let currentRotation = rings.map(x => x.rotationIndex);
        solutions.push(currentRotation);
      }
    } else {
      let newSolutions = checkSubSolutions(rings, ringIndex + 1);
      solutions = solutions.concat(newSolutions);
    }
  }
  return solutions;
}

function checkSingleSolution(rings) {
  let visited = [];
  let loops = [];
  let nonLoops = [];
  let unvisited = [];

  for (let i = 0; i < rings.length; i++) {
    unvisited = unvisited.concat(rings[i].splines);
  }
  if (unvisited.length < 1) {
    return false;
  }
  while (unvisited.length > 0) {
    let loop = [];
    let l = extractLoop(unvisited);
    if (l.isLoop) {
      loops.push(l.loop);
    } else {
      nonLoops.push(l.loop);
    }
    unvisited = unvisited.filter(x => !l.loop.includes(x));
  }
  for (var i = 0; i < loops.length; i++) {
    let hu = map(i, 0, loops.length + 1, 0, 360);
    for (var j = 0; j < loops[i].length; j++) {
      loops[i][j].hue = hu;
    }
  }

  return {
    solved: loops.length == 1 && nonLoops.length == 0,
    loops: loops,
    nonLoops: nonLoops
  };
}

function extractLoop(splines) {
  let unvisited = splines.slice();
  let loop = [];
  let isLoop = false;

  let startSpline = splines.pop();
  let currentSpline = startSpline;
  let currentSocket = currentSpline.start;
  let nextSocket, nextSpline;
  let order = 0;
  while ((startSpline !== nextSpline) && (unvisited.length > 0)) {
    nextSocket = currentSpline.otherSocket(currentSocket);
    let nextRing, nextSide;
    if (nextSocket.side === sideType.INSIDE) {
      nextRing = nextSocket.ring.innerRing;
      nextSide = sideType.OUTSIDE;
    } else
    if (nextSocket.side === sideType.OUTSIDE) {
      nextRing = nextSocket.ring.outerRing;
      nextSide = sideType.INSIDE;
    } else {
      debugger;
      break;
    }
    let i = nextSocket.index + currentSpline.ring.rotationIndex - nextRing.rotationIndex;
    i = wrap(i,0,nextRing.rotationMax);
    nextSocket = nextRing.getSocket(i, nextSide);
    nextSpline = nextSocket.spline;
    if (nextSpline) {
      loop.push(nextSpline);
      nextSpline.label = order;
      order++;
      if (nextSpline === startSpline) {
        isLoop = true;
        break;
      }
      currentSpline = nextSpline;
      currentSocket = nextSocket;
    } else {
      break;
    }
  }
  return {
    isLoop: isLoop,
    loop: loop
  };
}
