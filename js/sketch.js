var start = 0;
var rings = [];
var pastRings = [];
var thickness = 76;
var sectors = Math.floor(Math.random() * 7 + 2) * 2;
// var pathCount = 32;
var ringCount = 3;
var avoidCycles = false;
var speed = 0.01;
var delay = 250;
var lastMoved = 0;
var moving = true;
var movingRing = 0;
var animate = false;
var lastPos = 0;
var target = Math.PI * 2 / sectors;
// var globalSeed = 8779;
var trees = [];
const splineType = {
  INSIDE: -1,
  OUTSIDE: 1,
  CROSSING: 0
}
var splineRequirements = {
  minSplines: 0,
  notAllCrossings: true,
  someCrossings: true
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
  if (animate) {
    if (moving) {
      moveRing()
    } else {
      if (millis() - lastMoved > delay) {
        moving = true;
        lastMoved = millis();
      }
    }
  }
  for (var i = 0; i < rings.length; i++) {
    rings[i].show();
  }
  // noLoop();
}

function saveAll() {
  save();
}

function next() {
  pastRings.push(rings);
  createRings();
  clear();
  start = millis();
}

function previous() {
  if (rings.length > 0) {
    rings = pastRings.pop();
    clear();
    start = millis();
    loop();
  }
}

function toggleAnimate() {
  animate = !animate;
}

function moveRing() {
  var r = rings[movingRing];
  var f = (millis() - lastMoved) / delay;
  var currentRot = map(f, 0, 1, lastPos, lastPos + target);
  r.rotation = currentRot;
  if (f > 1) {
    r.rotation = lastPos + target;
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

function findSolutions(rings) {
  var solutions = [];
  var rotation = [];
  for (var i = 0; i < rings.length - 1; i++) {
    rotation.push(0);
  }
  solutions.push(checkSubSolutions(rings, 1, rotation));
}

function checkSubSolutions(rings, index, rotation) {
  if (index >= rings.length) {
    return false;
  }
  var ring = rings[index];
  var sockets = ring.outerSockets || ring.innerSockets || [];
  var solutions = [];
  for (var i = 0; i < sockets.length; i++) {
    var currentRotation = rotation.slice();
    currentRotation[index] = i;

    if (index == rings.length - 1 && checkSingleSolution(rings, currentRotation)) {
      solutions.push(currentRotation);
    } else {
      var newSolutions = checkSubSolutions(rings, index + 1, currentRotation);
      solutions.concat(newSolutions);
    }
  }
  return solutions;
}

function checkSingleSolution(rings, rotations) {
  var visited = [];
  var loops = [];
  var nonLoops = [];
  var unvisited = [];

  for (var i = 0; i < rings.length; i++) {
    unvisited.concat(rings[i].splines.slice());
  }
  if (unvisited.length < 1) {
    return false;
  }
  var loop = [];
  var startSpline = unvisited.pop();
  extractLoop(unvisited, startSpline);
}

function extractLoop(splines, startSpline) {
  var unvisited = splines.copy();
  var loop = [];
  var isLoop = true;

  var currentSpline = startSpline;
  var currentSocket = currentSpline.start;
  var nextSocket, nextSpline;

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

function getSplineByIndex(ring, side, index) {
  var sockets;
  if (side == splineType.INSIDE) {
    sockets = ring.innerSockets;
  } else {
    sockets = ring.outerSockets;
  }
  if (index >= sockets.length) {
    return null;
  }
  var sock = sockets[index];
  var splines = sock.splines;
  if (side == splineType.INSIDE) {
    return splines.inner ? splines.inner : null;
  } else {
    return splines.outer ? splines.outer : null;
  }
}


function keyPressed() {
  // console.log(key);
  if (key.toLowerCase() == 'n') {
    next();
  }
  if (key.toLowerCase() == 'p') {
    previous();
  }
  if (key.toLowerCase() == 's') {
    saveAll();
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
    var innerSockets = sectors;
    if (r) {
      innerSockets = r.outerSockets;
    }
    var outerSockets = sectors;
    if (i == ringCount - 1) {
      outerSockets = 0;
    }
    if (i == 0) {
      innerSockets = 0;
    }
    var r = new Ring(i, c, innerRadius, thickness, innerSockets, outerSockets);
    r.innerRing = prevRing;
    if (prevRing) {
      prevRing.outerRing = r;
      for (var j = 0; j < prevRing.outerSockets.length; j++) {
        prevRing.outerSockets[j].outerRing = r;
      }
    }
    rings.push(r);
    prevRing = r;
  }

  for (var i = 0; i < rings.length; i++) {
    var r = rings[i];
    r.validSplines = false;
    var loopCount = 0;
    while (r.validSplines == false) {
      loopCount++;
      if (loopCount >= 1000) {
        debugger;
        throw "Infinite loop";
      }
      r.splines = clusterSockets(r);
      r.validSplines = validateSplines(r);
    }
    // var validSolution = checkSolution(rings);
    // console.log("Solved: " + validSolution)
  }
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
