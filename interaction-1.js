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

// Store previous acceleration values to calculate change
let prevAccX = 0, prevAccY = 0, prevAccZ = 0;
let lastShakeTime = 0;
const SHAKE_COOLDOWN = 100; // milliseconds

function accelerationChange(accx, accy, accz) {
    // Calculate acceleration change (shake intensity)
    const accChange = Math.sqrt(
        Math.pow(accx - prevAccX, 2) + 
        Math.pow(accy - prevAccY, 2) + 
        Math.pow(accz - prevAccZ, 2)
    );
    
    // Update previous values
    prevAccX = accx;
    prevAccY = accy;
    prevAccZ = accz;
    
    // Store shake intensity for use in deviceShaken()
    window.lastShakeIntensity = accChange;
}

// Mapping 1: Shake (horizontal) → Engine
// Gesture: iPhoneを横向きに持って振る
// Sound: Engine (engine.wasm)
// Motivation: エンジンの回転数が動きの激しさに応じて変化するように、横向きに持ったデバイスを激しく振るとエンジン音が大きくなる
function rotationChange(rotx, roty, rotz) {
    // Check if device is held horizontally (landscape orientation)
    // rotationY (Pitch) should be around 0° or 180° for horizontal
    // Allow some tolerance: -30° to 30° or 150° to 210° (wrapped)
    const isHorizontal = (roty !== null && (
        (roty >= -30 && roty <= 30) || 
        (roty >= 150 && roty <= 180) || 
        (roty >= -180 && roty <= -150)
    ));
    
    // Store horizontal state for use in deviceShaken()
    window.isDeviceHorizontal = isHorizontal;
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
// Mapping 1: Shake (horizontal) → Engine
// Gesture: iPhoneを横向きに持って振る
// Sound: Engine (engine.wasm)
// Motivation: エンジンの回転数が動きの激しさに応じて変化するように、横向きに持ったデバイスを激しく振るとエンジン音が大きくなる
function deviceShaken() {
    // Only trigger if device is held horizontally
    if (window.isDeviceHorizontal) {
        shaketimer = millis();
        statusLabels[0].style("color", "pink");
        
        // Get shake intensity (calculated in accelerationChange)
        const shakeIntensity = window.lastShakeIntensity || 0;
        
        // Play audio with intensity-based volume
        playAudio(shakeIntensity);
    }
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

// Play engine sound when device is shaken horizontally
// Uses /engine/gate parameter and /engine/volume or /engine/maxSpeed based on shake intensity
// Shake intensity affects the volume or maxSpeed parameter
function playAudio(shakeIntensity = 0) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    
    // Normalize shake intensity to 0.0-1.0 range
    // Typical shake intensity ranges from 0 to ~50, adjust threshold as needed
    const normalizedIntensity = Math.min(1.0, Math.max(0.0, shakeIntensity / 30.0));
    
    // Trigger engine sound with gate
    dspNode.setParamValue("/engine/gate", 1);
    
    // Set volume or maxSpeed based on shake intensity
    // Adjust volume: 0.3 (min) to 1.0 (max) based on intensity
    const volume = 0.3 + (normalizedIntensity * 0.7);
    dspNode.setParamValue("/engine/volume", volume);
    
    // Optionally adjust maxSpeed as well
    const maxSpeed = 0.1 + (normalizedIntensity * 0.9);
    dspNode.setParamValue("/engine/maxSpeed", maxSpeed);
    
    // Keep gate on for a short duration
    setTimeout(() => { 
        dspNode.setParamValue("/engine/gate", 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================