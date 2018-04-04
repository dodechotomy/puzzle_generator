let start = 0;
let rings = [];
let pastRings = [];
let thickness = 76;
let sectors = 16;//Math.floor(Math.random() * 7 + 2) * 2;
// let pathCount = 32;
let ringCount = 3;
let avoidCycles = false;
let speed = 0.01;
let delay = 250;
let lastMoved = 0;
let moving = true;
let movingRing = 0;
let animate = false;
let lastPos = 0;
let validSolutions;
let currentSolution = 0;
let attempt = 0;
let debug = false;
let target = Math.PI * 2 / sectors;
// let globalSeed = 123;
let trees = [];
const sideType = {
  INSIDE: "inside",
  OUTSIDE: "outside",
  INNER: "inside",
  OUTER: "outside",
  CROSSING: "cross"
}
const splineRequirements = {
  minSplines: 0,
  notAllCrossings: true,
  someCrossings: true
}


function setup() {
  createCanvas(window.innerWidth, window.innerHeight, SVG); // Create SVG Canvas
  start = millis();
  createRings();
  checkSingleSolution(rings);
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
  for (let i = 0; i < rings.length; i++) {
    rings[i].show();
  }
  // noLoop();
}

function solve(i = 0) {
  findSolutions(rings);
  nextSolution();
}

function nextSolution() {
  if (validSolutions.length < 1) {
    console.log("no solutions");
    return;
  }
  setRotations(validSolutions[currentSolution]);
  currentSolution++;
  currentSolution = currentSolution % validSolutions.length;
  checkSingleSolution(rings);
}

function setRotations(rots) {
  if (rots.length !== rings.length) {
    debugger;
    return;
  }
  for (var i = 0; i < rots.length; i++) {
    rings[i].rotationIndex = rots[i];
  }
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
  let f = (millis() - lastMoved) / delay;
  let currentRot = map(f, 0, 1, lastPos, lastPos + target);
  r.rotation = currentRot;
  if (f > 1) {
    r.rotation = lastPos + target;
    lastMoved = millis();
    moving = false;
    movingRing++;
    movingRing = movingRing % rings.length;
    let r = rings[movingRing];
    let d = TWO_PI / sectors;
    d *= (random() < 0.5) ? 1 : -1;
    d *= (random() < 0.25) ? 2 : 1;
    d *= (random() < 0.125) ? 3 : 1;
    r.rotation = r.rotation % TWO_PI;
    target = d;
    lastPos = r.rotation;
  }
}

// function getSplineByIndex(ring, side, index) {
//   let sockets;
//   if (side == sideType.INSIDE) {
//     sockets = ring.innerSockets;
//   } else {
//     sockets = ring.outerSockets;
//   }
//   if (index >= sockets.length) {
//     return null;
//   }
//   let sock = sockets[index];
//   let splines = sock.splines;
//   if (side == sideType.INSIDE) {
//     return splines.inner ? splines.inner : null;
//   } else {
//     return splines.outer ? splines.outer : null;
//   }
// }

function keyPressed() {
  // console.log(key);
  if (key.toLowerCase() == 'n') {
    nextSolution();
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
    let seed = floor(millis());
    console.log("seed: " + seed);
    randomSeed(seed);
  }
  rings = [];
  let prevRing = null;
  for (let i = 0; i < ringCount; i++) {
    let center = createVector(width / 2, height / 2);
    let innerRadius = thickness * (i + 1);
    let innerSockets = sectors;
    // if (prevRing) {
    //   innerSockets = prevRing.outerSockets;
    // }
    let outerSockets = sectors;
    if (i == ringCount - 1) {
      outerSockets = 0;
    }
    if (i == 0) {
      innerSockets = 0;
    }
    let r = new Ring(i, center, innerRadius, thickness, innerSockets, outerSockets);
    r.innerRing = prevRing;
    if (prevRing) {
      prevRing.outerRing = r;
      for (let j = 0; j < prevRing.outerSockets.length; j++) {
        prevRing.outerSockets[j].outerRing = r;
      }
    }
    rings.push(r);
    prevRing = r;
  }

  for (let i = 0; i < rings.length; i++) {
    let r = rings[i];
    r.validSplines = false;
    let loopCount = 0;
    while (r.validSplines == false) {
      loopCount++;
      if (loopCount >= 1000) {
        debugger;
        throw "Infinite loop";
      }
      r.splines = clusterSockets(r);
      r.validSplines = validateSplines(r);
    }
  }
  // let validSolutions = checkSubSolutions(rings, 0);
  findSolutions(rings);
  currentSolution = 0;
  if (validSolutions.length == 1) {
    // console.log("Solved!")
    // console.log(validSolutions);
    nextSolution();
  } else {
    // console.log("Unsolved")
    // console.log(validSolutions);
    if(attempt > 1000){
      console.log( "Couldn't generate solvable puzzle");
    }else{
      attempt++;
    createRings();
    }
  }
  attempt = 0;
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
