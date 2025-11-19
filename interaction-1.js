//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("engine") depending on your wasm file name
// NOTE: You need to compile engine.dsp using Faust IDE to generate engine.wasm
const dspName = "engine1";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
  window[dspName] = instance;
} else {
  const exp = {};
  exp[dspName] = instance;
  module.exports = exp;
}

// The name should be the same as the WASM file, so change engine with your wasm file name
// NOTE: If engine.wasm doesn't exist, this will fail. You need to compile engine.dsp using Faust IDE.
engine1.createDSP(audioContext, 1024).then((node) => {
  dspNode = node;
  dspNode.connect(audioContext.destination);
  console.log("params: ", dspNode.getParams());
  const jsonString = dspNode.getJSON();
  jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
  dspNodeParams = jsonParams;
  // Check engine1 parameters min/max values for safety
  const engineGateParam = findByAddress(dspNodeParams, "/untitled/gate");
  const engineMaxSpeedParam = findByAddress(dspNodeParams, "/untitled/maxSpeed");
  if (engineGateParam) {
    const [minValue, maxValue] = getParamMinMax(engineGateParam);
    console.log('untitled/gate - Min value:', minValue, 'Max value:', maxValue);
  }
  if (engineMaxSpeedParam) {
    const [minValue, maxValue] = getParamMinMax(engineMaxSpeedParam);
    console.log('untitled/maxSpeed - Min value:', minValue, 'Max value:', maxValue);
  }
  console.log('Available parameters:', dspNode.getParams());
});

//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function accelerationChange(accx, accy, accz) {
  // changeAccelerationParams()
//   if (accx>10 && accx < 60) {
    
   
//   }
}

// Mapping 1: Tilt → Engine
// Gesture: Tilt the device along the X-axis (Roll angle)
// Sound: Engine (engine.wasm)
// Motivation: The engine sound is triggered when rotationX exceeds 90°
let lastTriggerTime = 0;
const TRIGGER_COOLDOWN = 200; // milliseconds to prevent continuous triggering
const ROTATION_X_THRESHOLD = 90.0;

function rotationChange(rotx, roty, rotz) {
    if (rotx === null || !dspNode) {
        return;
    }
    
    const absRotX = Math.abs(rotx);
    const currentTime = millis();
    
    // Check if rotationX exceeds threshold and cooldown has passed
    if (absRotX > ROTATION_X_THRESHOLD && 
        (currentTime - lastTriggerTime > TRIGGER_COOLDOWN)) {
        playAudio();
        lastTriggerTime = currentTime;
    }
}

function mousePressed() {
  playAudio();
  // Use this for debugging from the desktop!
}

function deviceMoved() {
  movetimer = millis();
  statusLabels[2].style("color", "pink");
}

function deviceTurned() {
  threshVals[1] = turnAxis;
}
function deviceShaken() {
  shaketimer = millis();
  statusLabels[0].style("color", "pink");
//   playAudio();
}

function getMinMaxParam(address) {
  const exampleMinMaxParam = findByAddress(dspNodeParams, address);
  // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
  const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
  console.log("Min value:", exampleMinValue, "Max value:", exampleMaxValue);
  return [exampleMinValue, exampleMaxValue];
}

// function getRandomBetweenTenAndSixty() {
//   // Generate a uniform integer in the inclusive range [10, 60]
//   return Math.floor(Math.random() * 51) + 10;
// }

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// Play engine sound when rotationX exceeds 90°
// Uses /untitled/gate parameter as a gate (0/1)
// Note: Actual parameter names: /untitled/gate, /untitled/maxSpeed, /untitled/volume, etc.
function playAudio() {
  if (!dspNode) {
    return;
  }
  if (audioContext.state === "suspended") {
    return;
  }
  // Use actual parameter names from engine1.wasm
  const gateParam = "/untitled/gate";
  dspNode.setParamValue(gateParam, 1);
  setTimeout(() => { 
    dspNode.setParamValue(gateParam, 0);
  }, 100);
}

//==========================================================================================
// END
//==========================================================================================