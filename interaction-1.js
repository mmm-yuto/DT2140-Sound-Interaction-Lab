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
    
    // Debug: Log rotationX values (only log occasionally to avoid spam)
    if (Math.random() < 0.01) { // Log 1% of the time
        console.log('rotationX:', rotx, 'absRotX:', absRotX);
    }
    
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
    
    // Debug: Log volume level when it changes
    if (window.lastVolume !== volume) {
        console.log('Volume level changed:', volume, 'for absRotX:', absRotX);
        window.lastVolume = volume;
    }
    
    // Play audio with the calculated volume level
    playAudio(volume);
}

function mousePressed() {
    // Test: Play audio at 50% volume for debugging
    console.log('Mouse pressed - Testing engine sound at 50% volume');
    playAudio(0.5);
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
// Only starts playback if engine is not already playing
function playAudio(volume = 0.0) {
    // Debug: Check if dspNode is loaded
    if (!dspNode) {
        console.warn('playAudio: dspNode is null. Engine WASM may not be loaded yet.');
        return;
    }
    
    // Debug: Check audio context state
    if (audioContext.state === 'suspended') {
        console.warn('playAudio: audioContext is suspended. Click "Turn On DSP" button.');
        return;
    }
    
    // Initialize engine playing state if not set
    if (window.isEnginePlaying === undefined) {
        window.isEnginePlaying = false;
    }
    
    // Clamp volume to valid range (0.0 to 1.0)
    const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
    
    // If volume is 0, turn off the gate and stop playback
    if (clampedVolume === 0.0) {
        if (window.isEnginePlaying) {
            dspNode.setParamValue("/engine/gate", 0);
            window.isEnginePlaying = false;
            // Debug: Log when gate is turned off
            console.log('Engine gate turned OFF (volume = 0)');
        }
        return;
    }
    
    // If engine is not playing, start playback
    if (!window.isEnginePlaying) {
        dspNode.setParamValue("/engine/gate", 1);
        window.isEnginePlaying = true;
        console.log('Engine started playing');
    }
    
    // Update volume and speed parameters (always update these, even if already playing)
    // Map volume level (0.0 to 1.0) to engine volume parameter
    // Minimum volume threshold to ensure engine is audible
    const minVolume = 0.1;
    const engineVolume = minVolume + (clampedVolume * 0.9); // 0.1 to 1.0
    dspNode.setParamValue("/engine/volume", engineVolume);
    
    // Adjust maxSpeed based on volume level
    const maxSpeed = 0.1 + (clampedVolume * 0.9);
    dspNode.setParamValue("/engine/maxSpeed", maxSpeed);
    
    // Debug: Log when volume changes
    if (window.lastEngineVolume !== engineVolume) {
        console.log('Engine volume updated - Volume:', clampedVolume, 'Engine Volume:', engineVolume.toFixed(2), 'MaxSpeed:', maxSpeed.toFixed(2));
        window.lastEngineVolume = engineVolume;
    }
}

//==========================================================================================
// END
//==========================================================================================