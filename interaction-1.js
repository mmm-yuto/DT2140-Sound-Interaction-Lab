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
const dspName = "engine";
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
engine.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('Engine DSP loaded successfully');
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Check engine parameters min/max values for safety
        // Engine parameters: gate, volume, maxSpeed, etc.
        const engineGateParam = findByAddress(dspNodeParams, "/engine/gate");
        const engineVolumeParam = findByAddress(dspNodeParams, "/engine/volume");
        if (engineGateParam) {
            const [minValue, maxValue] = getParamMinMax(engineGateParam);
            console.log('Engine/gate - Min value:', minValue, 'Max value:', maxValue);
        }
        if (engineVolumeParam) {
            const [minValue, maxValue] = getParamMinMax(engineVolumeParam);
            console.log('Engine/volume - Min value:', minValue, 'Max value:', maxValue);
        }
    })
    .catch(error => {
        console.error('Failed to load engine.wasm:', error);
        console.error('Please compile engine.dsp using Faust IDE to generate engine.wasm');
        alert('Error: engine.wasm not found. Please compile engine.dsp using Faust IDE and place engine.wasm in the project root.');
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
    // Not used for this interaction
}

// Mapping 1: Tilt → Engine
// Gesture: rotationX angle controls engine volume in 5 discrete levels
// Sound: Engine (engine.wasm)
// Motivation: The device tilt angle (rotationX) controls the engine volume in 5 distinct levels
// Volume levels:
//   RotationX: 0° → 0% volume
//   RotationX: 30-60° → 20% volume
//   RotationX: 60-90° → 40% volume
//   RotationX: 90-120° → 60% volume
//   RotationX: 120-150° → 80% volume
//   RotationX: 150-180° → 100% volume
function rotationChange(rotx, roty, rotz) {
    if (rotx === null) {
        playAudio(0.0);
        return;
    }
    
    // Use absolute value to handle both positive and negative angles
    const absRotX = Math.abs(rotx);
    
    // Map rotationX to volume levels (0.0 to 1.0)
    let volume = 0.0;
    
    if (absRotX >= 0 && absRotX < 30) {
        // 0° to 30°: 0% volume
        volume = 0.0;
    } else if (absRotX >= 30 && absRotX < 60) {
        // 30° to 60°: 20% volume
        volume = 0.2;
    } else if (absRotX >= 60 && absRotX < 90) {
        // 60° to 90°: 40% volume
        volume = 0.4;
    } else if (absRotX >= 90 && absRotX < 120) {
        // 90° to 120°: 60% volume
        volume = 0.6;
    } else if (absRotX >= 120 && absRotX < 150) {
        // 120° to 150°: 80% volume
        volume = 0.8;
    } else if (absRotX >= 150 && absRotX <= 180) {
        // 150° to 180°: 100% volume
        volume = 1.0;
    } else {
        // Outside range, no sound
        volume = 0.0;
    }
    
    // Play audio with the calculated volume level
    playAudio(volume);
}

function mousePressed() {
    playAudio()
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
    // Not used for this interaction - volume is controlled by rotationX in rotationChange()
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// Play engine sound with volume controlled by rotationX in 5 discrete levels
// Uses /engine/gate parameter and /engine/volume based on rotationX angle
// Volume levels: 0% (0°), 20% (30-60°), 40% (60-90°), 60% (90-120°), 80% (120-150°), 100% (150-180°)
function playAudio(volume = 0.0) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    
    // Clamp volume to valid range (0.0 to 1.0)
    const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
    
    // If volume is 0, turn off the gate
    if (clampedVolume === 0.0) {
        dspNode.setParamValue("/engine/gate", 0);
        return;
    }
    
    // Set gate to 1 to start the engine
    dspNode.setParamValue("/engine/gate", 1);
    
    // Map volume level (0.0 to 1.0) to engine volume parameter
    // Minimum volume threshold to ensure engine is audible
    const minVolume = 0.1;
    const engineVolume = minVolume + (clampedVolume * 0.9); // 0.1 to 1.0
    dspNode.setParamValue("/engine/volume", engineVolume);
    
    // Adjust maxSpeed based on volume level
    const maxSpeed = 0.1 + (clampedVolume * 0.9);
    dspNode.setParamValue("/engine/maxSpeed", maxSpeed);
}

//==========================================================================================
// END
//==========================================================================================