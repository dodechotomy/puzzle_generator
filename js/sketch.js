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
    drawRing(rings[i]);
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
  var connections = ring.outerConnections || ring.innerConnections || [];
  var solutions = [];
  for (var i = 0; i < connections.length; i++) {
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
}

function extractLoop(splines, startSpline) {
  var unvisited = splines.copy();
  var loop = [];
  var isLoop = true;

  var currentSpline = startSpline;
  var currentConnection = currentSpline.start;
  var nextConnection, nextSpline;

  while (startSpline !== nextSpline && unvisited.length > 0) {
    nextConnection = currentSpline.otherConnection(currentConnection);
    nextSpline = nextConnection.otherSpline(currentSpline);
    if (nextSpline) {
      if (nextSpline === startSpline) {
        isLoop = true;
        break;
      } else {
        loop.push(nextSpline);
        currentSpline = nextSpline;
        currentConnection = nextConnection;
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
  var connections;
  if (side == splineType.INSIDE) {
    connections = ring.innerConnections;
  } else {
    connections = ring.outerConnections;
  }
  if (index >= connections.length) {
    return null;
  }
  var conn = connections[index];
  var splines = conn.splines;
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
    r.validSplines = false;
    var loopCount = 0;
    while (r.validSplines == false) {
      loopCount++;
      if (loopCount >= 1000) {
        debugger;
        throw "Infinite loop";
      }
      r.splines = clusterConnections(r);
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
