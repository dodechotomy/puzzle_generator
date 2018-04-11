function findSolutions(rings) {
  let solutions = checkSubSolutions(rings, 1);
  return solutions;
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
    //Ring with no sockets?
    return [];
  }

  if (ringIndex == rings.length - 1) {
    return checkLastRing(rings);
  } else {
    let subSolutions = [];
    for (let i = 0; i < ring.rotationMax; i++) {
      ring.rotationIndex = i;
      let newSolutions = checkSubSolutions(rings, ringIndex + 1);
      subSolutions = subSolutions.concat(newSolutions);
      if (settings.quickmode && subSolutions.length > 1) {
        return subSolutions;
      }
    }
    return subSolutions;
  }
}

function checkLastRing(rings) {
  let ring = rings[rings.length - 1];
  let solutions = [];
  for (let i = 0; i < ring.rotationMax; i++) {
    ring.rotationIndex = i;
    let newSolution = checkSingleSolution(rings);
    if (newSolution.solved) {
      newSolution.rotation = rings.map(x => x.rotationIndex)
      solutions.push(newSolution);
      if (settings.quickmode && solutions.length > 1) {
        return solutions;
      }
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
    return {
      solved: false,
      loops: [],
      nonLoops: []
    };
  }
  let loop = [];
  let l = extractLoop(unvisited);
  if (l.isLoop) {
    loops.push(l.loop);
  } else {
    nonLoops.push(l.loop);
  }
  unvisited = l.leftOver;
  if (unvisited < 0) {
    throw "loop too long";
  }
  if (unvisited == 0 && loops.length == 1) {
    colourLoop(loops[0]);
  }

  return {
    solved: unvisited == 0 && loops.length == 1 && nonLoops.length == 0,
    loops: loops,
    nonLoops: nonLoops
  };
}

function colourLoop(loop) {
  for (var j = 0; j < loop.length; j++) {
    let hu = map(j, 0, loop.length, 0, 360);
    loop[j].hue = hu;
  }
}

function extractLoop(splines) {
  // let unvisited = splines.slice();
  let loop = [];
  let isLoop = false;

  let startSpline = splines[0];
  loop.push(startSpline);
  let currentSpline = startSpline;
  let currentSocket = currentSpline.start;
  let nextSocket, nextSpline;
  while ((startSpline !== nextSpline) && (splines.length > 0)) {
    nextSocket = currentSpline.otherSocket(currentSocket);
    let nextRing, nextSide;
    if (nextSocket.side === sideType.INSIDE) {
      nextRing = nextSocket.ring.innerRing;
      nextSide = sideType.OUTSIDE;
    } else
    if (nextSocket.side === sideType.OUTSIDE) {
      nextRing = nextSocket.ring.outerRing;
      nextSide = sideType.INSIDE;
    }
    if (settings.simpleCenter) {
      let a = nextSocket.angle + currentSpline.ring.rotation - nextRing.rotation;
      a = wrap(a, 0, TWO_PI);
      nextSocket = nextRing.getSocketByAngle(a, nextSide);
    } else {
      let a = nextSocket.index + currentSpline.ring.rotationIndex - nextRing.rotationIndex;
      let s = nextRing.getSocket(a, nextSide);
      if (!s) {
        throw "next socket doesn't exist";
      }
      nextSocket = s
    }
    nextSpline = nextSocket.spline;
    if (nextSpline) {
      if (nextSpline === startSpline) {
        isLoop = true;
        break;
      } else {
        loop.push(nextSpline);
      }
      currentSpline = nextSpline;
      currentSocket = nextSocket;
    } else {
      break;
    }
  }
  return {
    isLoop: isLoop,
    loop: loop,
    leftOver: splines.length - loop.length
  };
}
