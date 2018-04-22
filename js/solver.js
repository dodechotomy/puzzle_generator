function findSolutions(rings) {
  validSolutions = checkSubSolutions(rings, 1);
  return validSolutions;
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
    // debugger; //Ring with no sockets?
    return [];
  }

  if (ringIndex == rings.length - 1) {
    let solutions = [];
    for (let i = 0; i < socks.length; i++) {
      ring.rotationIndex = i;
      let newSolution = checkSingleSolution(rings);
      if (newSolution.solved) {
        solutions.push(rings.map(x => x.rotationIndex));
        if (settings.QUICKMODE && solutions.length > 0) {
          return solutions;
        }
      }
    }
    return solutions;
  } else {
    let subSolutions = [];
    for (let i = 0; i < socks.length; i++) {
      ring.rotationIndex = i;
      let newSolution = checkSubSolutions(rings, ringIndex + 1);
      subSolutions = subSolutions.concat(newSolution);
      if (settings.QUICKMODE && subSolutions.length > 1) {
        return subSolutions;
      }
    }
    return subSolutions;
  }
}

function checkSingleSolution(rings) {
  let visited = [];
  let loops = [];
  let nonLoops = [];
  let splines = [];

  for (let i = 0; i < rings.length; i++) {
    splines = splines.concat(rings[i].splines);
  }
  if (splines.length < 1) {
    return {
      solved: false,
      loops: [],
      nonLoops: []
    };
  }
  // while (unvisited.length > 0) {
  let loop = [];
  let l = extractLoop(splines);
  if (l.isLoop) {
    loops.push(l.loop);
  } else {
    nonLoops.push(l.loop);
  }
  let leftOver = l.leftOver;
  // }
  for (var i = 0; i < loops.length; i++) {
    for (var j = 0; j < loops[i].length; j++) {
      let hu = map(j, 0, loops[i].length + 1, 0, 360);
      loops[i][j].hue = hu;
    }
  }

  return {
    solved: leftOver == 0,
    loops: loops,
    nonLoops: nonLoops
  };
}

function extractLoop(splines) {
  // let unvisited = splines.slice();
  let loop = [];
  let isLoop = false;

  let startSpline = splines[0]; //unvisited.pop();
  loop.push(startSpline);
  let currentSpline = startSpline;
  let currentSocket = currentSpline.start;
  let nextSocket, nextSpline;
  let order = 0;
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
    let i = nextSocket.index + currentSpline.ring.rotationIndex - nextRing.rotationIndex;
    i = wrap(i, 0, nextRing.rotationMax);
    nextSocket = nextRing.getSocket(i, nextSide);
    if (typeof nextSocket === 'undefined') {
      break;
    }
    nextSpline = nextSocket.spline;
    if (nextSpline) {
      if (nextSpline === startSpline) {
        isLoop = true;
        break;
      } else {
        loop.push(nextSpline);
        // let index = unvisited.indexOf(nextSpline);
        // if (index >= 0) {
        //   unvisited.splice(index, 1);
        // }
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
