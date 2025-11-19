//==========================================================================================
// P5.js
//==========================================================================================

//init only -- edit colours in setup function 
let bgCol = 255;

//init slider stuff
let sliders = [];
let sliderWidth;
let threshVals = [0, " ", 0];

//init label stuff
let labels = ["", "Acceleration X", "Acceleration Y", "Acceleration Z", "", "Rotation X", "Rotation Y", "Rotation Z"];
let labelIDs = ["", "accx", "accy", "accz", "", "rotX", "rotY", "rotZ"];
let vals = [];
let stateLabels = ["shaken", "turned", "moved"];
let buttons = [];
let buttonWidth;
let buttonLabels = ["Turn On DSP", "Request Permission"];
let buttonIDs = ["myButton", "requestPermission"];

let p = [];
let statusLabels = [];

let movetimer = 0;
let shaketimer = 0;
let turntimer = 0;

//==========================================================================================
// AUDIO
//==========================================================================================

function contextAudioStart() {
  if (!dspNode) {
    alert('DSP node not loaded. Please check:\n1. WASM file exists in the project root\n2. Check browser console for errors\n3. Make sure to compile .dsp files using Faust IDE');
    console.error('DSP node is null. Cannot start audio.');
    return;
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
    // startDsp();
    buttons[0].html('Turn Off DSP');
    setMotionListeners()
  } else {
    audioContext.suspend();
    buttons[0].html('Turn On DSP');
  }
}

//==========================================================================================
// END AUDIO
//==========================================================================================



function setup() {
  createCanvas(windowWidth, windowHeight);

  setMotionListeners();

  let valBox = createDiv();
  valBox.id("valuelabels");
  for (i = 0; i < labels.length; i++) {
    if (labels[i] != "") {
      p[i] = createP(labels[i] + ":");
      p[i].id(labelIDs[i]);
      p[i].parent(valBox.elt);
    }
  }

  let statBox = createDiv();
  statBox.id("status");

  statusLabels[0] = createP(stateLabels[0] );
  statusLabels[0].parent(statBox.elt);
  statusLabels[0].id("shaken");

  statusLabels[1] = createP(stateLabels[1] );
  statusLabels[1].parent(statBox.elt);
  statusLabels[1].id("turned");

  statusLabels[2] = createP(stateLabels[2] );
  statusLabels[2].parent(statBox.elt);
  statusLabels[2].id("moved");

  //init sliders
  let dSlider1 = createDiv();
  dSlider1.id("slider1");
  dSlider1.parent(statBox.elt);

  sliders[1] = createP("shake threshold");
  sliders[1].parent(dSlider1.elt);
  //sliderWidth = width / 4;
  sliders[0] = createSlider(0, 100, 30, 1); //shaker thresh, 0 - 100, default = 30, step = 1

  sliders[0].size(sliderWidth);
  sliders[0].parent(dSlider1.elt);
  sliders[0].style('position', 'unset');

  let dSlider2 = createDiv();
  dSlider2.id("slider2");
  dSlider2.parent(statBox.elt);

  sliders[3] = createP("move threshold");
  sliders[3].parent(dSlider2.elt);

  sliders[2] = createSlider(0, 75, 50, 1); //move thresh, 0 - 75, default = 50, step = 1
///  sliders[2].size(sliderWidth);
  sliders[2].parent(dSlider2.elt);
  sliders[2].style('position', 'unset');

  let buttonBox = createDiv();
  buttonBox.id("buttonBox");
  //init buttons
  buttonWidth = width / 4;
  buttons[0] = createButton(buttonLabels[0]); //shaker thresh, 0 - 100, default = 30, step = 1
 
  buttons[0].id(buttonIDs[0]);
  buttons[0].parent(buttonBox.elt);
  buttons[0].mousePressed(contextAudioStart);
}

function draw() {
  //update realtime vals 

  vals[1] = round(accelerationX, 4);
  vals[2] = round(accelerationY, 4);
  vals[3] = round(accelerationZ, 4);
  vals[5] = round(rotationX, 1);
  vals[6] = round(rotationY, 1);
  vals[7] = round(rotationZ, 1);

  accelerationChange(accelerationX, accelerationY, accelerationZ);
  rotationChange(rotationX, rotationY, rotationZ);

  for (i = 0; i < labels.length; i++) {
    if (labels[i] != "") {
      document.getElementById(labelIDs[i]).innerHTML =
        labels[i] + ": " + vals[i];
    }
  }

  threshVals[0] = sliders[0].value();
  threshVals[2] = sliders[2].value();
  setShakeThreshold(threshVals[0]);
  setMoveThreshold(threshVals[2]);

  if (millis() - shaketimer > 1000) { 
    statusLabels[0].style("color", "black");
  }
  if (millis() - turntimer > 1000) { 
    statusLabels[1].style("color", "black");
  }
  if (millis() - movetimer > 1000) {
    statusLabels[2].style("color", "black");
  }
  
}

//==========================================================================================
// END
//==========================================================================================