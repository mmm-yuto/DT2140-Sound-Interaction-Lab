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

// Mapping 1: Shake (Horizontal) → Engine
// Gesture: rotationXが-50°から50°の範囲で音が鳴る
// Sound: Engine (engine.wasm)
// Motivation: rotationX:0の時に音は鳴らず、-50°や50°に近づくにつれて音量が大きくなる
function rotationChange(rotx, roty, rotz) {
    // Check if rotationX is in the valid range (-50° to 50°)
    if (rotx !== null && rotx >= -50 && rotx <= 50) {
        // Calculate volume based on distance from 0°
        // When rotx = 0°, volume = 0.0
        // When rotx = ±50°, volume = 1.0
        // Use absolute value to get distance from center
        const absRotX = Math.abs(rotx);
        // Normalize from 0° to 50° to 0.0 to 1.0
        const normalizedVolume = absRotX / 50.0;
        
        // Play audio with volume based on rotationX
        playAudio(normalizedVolume);
    } else {
        // Outside the range, stop the sound
        playAudio(0.0);
    }
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

// Play engine sound with volume controlled by rotationX
// Uses /engine/gate parameter and /engine/volume based on rotationX angle
// Volume: 0.0 (rotationX = 0°) to 1.0 (rotationX = ±50°)
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
    
    // Set volume based on rotationX (0.0 to 1.0)
    // Minimum volume threshold to ensure engine is audible
    const minVolume = 0.1;
    const engineVolume = minVolume + (clampedVolume * 0.9); // 0.1 to 1.0
    dspNode.setParamValue("/engine/volume", engineVolume);
    
    // Optionally adjust maxSpeed based on volume as well
    const maxSpeed = 0.1 + (clampedVolume * 0.9);
    dspNode.setParamValue("/engine/maxSpeed", maxSpeed);
}

//==========================================================================================
// END
//==========================================================================================