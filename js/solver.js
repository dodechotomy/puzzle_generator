
function findSolutions(rings) {
  let solutions = [];
  let rotation = [];
  for (let i = 0; i < rings.length - 1; i++) {
    rotation.push(0);
  }
  solutions.push(checkSubSolutions(rings, 1, rotation));
}

function checkSubSolutions(rings, index, rotation) {
  if (index >= rings.length) {
    return false;
  }
  let ring = rings[index];
  let sockets = ring.outerSockets || ring.innerSockets || [];
  let solutions = [];
  for (let i = 0; i < sockets.length; i++) {
    let currentRotation = rotation.slice();
    currentRotation[index] = i;

    if (index == rings.length - 1 && checkSingleSolution(rings, currentRotation)) {
      solutions.push(currentRotation);
    } else {
      let newSolutions = checkSubSolutions(rings, index + 1, currentRotation);
      solutions.concat(newSolutions);
    }
  }
  return solutions;
}

function checkSingleSolution(rings, rotations) {
  let visited = [];
  let loops = [];
  let nonLoops = [];
  let unvisited = [];

  for (let i = 0; i < rings.length; i++) {
    unvisited.concat(rings[i].splines.slice());
  }
  if (unvisited.length < 1) {
    return false;
  }
  let loop = [];
  let startSpline = unvisited.pop();
  extractLoop(unvisited, startSpline);
}

function extractLoop(splines, startSpline) {
  let unvisited = splines.copy();
  let loop = [];
  let isLoop = true;

  let currentSpline = startSpline;
  let currentSocket = currentSpline.start;
  let nextSocket, nextSpline;

  while (startSpline !== nextSpline && unvisited.length > 0) {
    nextSocket = currentSpline.otherSocket(currentSocket);
    nextSpline = nextSocket.otherSpline(currentSpline);
    if (nextSpline) {
      if (nextSpline === startSpline) {
        isLoop = true;
        break;
      } else {
        loop.push(nextSpline);
        currentSpline = nextSpline;
        currentSocket = nextSocket;
      }
    } else {
      isLoop = false;
      break;
    }
  }
  return {
    isLoop: isLoop,
    loop: loop
  };
}
