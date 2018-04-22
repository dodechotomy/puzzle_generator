'use strict';
let start = 0;
let rings = [];
let pastRings = [];
let thickness = 76;
let sectors = 16;
let ringCount = 4;
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
let totalAttempts = 0;
let timeLimit = 1000 / 30;
let timePassed = 0;
let debug = false;
let target = Math.PI * 2 / sectors;
let generating = false;
// let globalSeed = 123;
let trees = [];
let batchID = 0;
let unitID = 0;
let saveLast = false;
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
let ringRadii = [
  [12.75, 21.75],
  [25.75, 35.5],
  [39.5, 49.25],
  [52.25, 63.5]
];
let pixelWidth = 362.83;
let mmWidth = 128;
let settings = {
  QUICKMODE: true,
  strokeWeight: 1,
  ringFillColor: 255,
  scale: 1,
  renderScale: pixelWidth / mmWidth,
  batchMode: false,
  batchSize: 10,
  seed: 0,
  minSolutions: 1,
  maxSolutions: 2,
  maxSplines: [4,100,100,100],
  closeness: 10
}


function setup() {
  createCanvas(pixelWidth, pixelWidth, SVG); // Create SVG Canvas
  strokeCap(PROJECT);
  // settings.ringFillColor = color('')
  // start = millis();
  // checkSingleSolution(rings);
}

function draw() {

  if (saveLast) {
    saveLast = false;
    saveAll();
    if (settings.batchMode && unitID < settings.batchSize) {
      unitID++;
      next();
      if (unitID >= settings.batchSize) {
        settings.batchMode = false;
      }
    }
  }

  document.getElementById("attemptCount").innerHTML = "Attempts: " + totalAttempts;
  if (validSolutions) {
    document.getElementById("solutionCount").innerHTML = "with " + validSolutions.length + " solutions";
  }
  if (generating) {
    timePassed = millis() - start;
    document.getElementById("totalTime").innerHTML = "in " + floor(timePassed / 1000) + " seconds";
    createRings();
  }
  if (generating) {
    // return;
  } else {
    document.getElementById("generatingOutput").innerHTML = "done";
    if (settings.batchMode) {
      saveLast = true;
    }
  }
  document.getElementById("timePerAttempt").innerHTML = round(totalAttempts / (timePassed / 1000)) + " attempts per second";

  clear();
  background(255);
  strokeWeight(2);
  // stroke('#ED225D');
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
  push();
  translate(width / 2, height / 2);
  scale(settings.renderScale);
  for (let i = 0; i < rings.length; i++) {
    rings[i].show();
  }
  pop();
  // noLoop();
}

function startBatch() {
  batchID = millis();
  unitID = 0;
  settings.batchMode = true;
}

function solve() {
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

function saveAll(name) {
  let fileName = name;
  if (!name || typeof name != "String") {
    fileName = "puzzle" + settings.seed;
  }
  if (settings.batchMode) {
    fileName = unitID + "of" + (settings.batchSize - 1) + "_" + fileName;
  }
  // console.log(fileName);
  save(fileName);
}

function next() {
  document.getElementById("generatingOutput").innerHTML = "generating";
  // pastRings.push(rings);
  totalAttempts = 0;
  attempt = 0;
  start = millis();
  generating = true;
  clear();
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

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }

function createRings() {
  totalAttempts++;
  if (typeof globalSeed == 'number') {
    settings.seed = globalSeed;
    randomSeed(globalSeed);
  } else {
    settings.seed = floor(millis()*100);
    console.log("seed: " + settings.seed);
    randomSeed(settings.seed);
  }
  rings = [];
  let prevRing = null;
  for (let i = 0; i < ringRadii.length; i++) {
    let center = createVector(0, 0);
    let innerRadius = ringRadii[i][0] * settings.scale;
    let thickness = ringRadii[i][1] * settings.scale - innerRadius;
    let innerSockets = sectors;
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
    if (i>0) {
      let filledOuterSockets = rings[i-1].outerSockets.filter(s => (s.spline != null));
      let indicesToKeep = filledOuterSockets.map(s => s.index);
      if(indicesToKeep.length > 0 && indicesToKeep.length < rings[i-1].outerSockets.length)
      rings[i].cullInnerSockets(indicesToKeep);
    }
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
  if (validSolutions === 0) {
    validSolutions = [];
    if (millis() < start + timeLimit) {
      attempt++;
      createRings();
    }
  } else
  if (validSolutions === 2) {
    validSolutions = [0, 0];
    if (millis() < start + timeLimit) {
      attempt++;
      createRings();
    }
  } else if (validSolutions.length >= settings.minSolutions && validSolutions.length <= settings.maxSolutions) {
    //TODO Add suport for accepting 2 solutions
    console.log("Solved!")
    console.log(validSolutions);
    nextSolution();
    generating = false;
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
