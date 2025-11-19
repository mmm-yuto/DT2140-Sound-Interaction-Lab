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
        console.log(dspName.charAt(0).toUpperCase() + dspName.slice(1) + ' DSP loaded successfully');
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Check engine parameters min/max values for safety
        // Engine parameters: gate, etc.
        const engineGateParam = findByAddress(dspNodeParams, "/" + dspName + "/gate");
        if (engineGateParam) {
            const [minValue, maxValue] = getParamMinMax(engineGateParam);
            console.log(dspName.charAt(0).toUpperCase() + dspName.slice(1) + '/gate - Min value:', minValue, 'Max value:', maxValue);
        }
        // If gate parameter doesn't exist, check for other common parameters
        console.log('Available parameters:', dspNode.getParams());
    })
    .catch(error => {
        console.error('Failed to load ' + dspName + '.wasm:', error);
        console.error('Please compile ' + dspName + '.dsp using Faust IDE to generate ' + dspName + '.wasm');
        alert('Error: ' + dspName + '.wasm not found. Please compile ' + dspName + '.dsp using Faust IDE and place ' + dspName + '.wasm in the project root.');
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
// Gesture: rotationXが90°を超えた時に音がなる
// Sound: Engine (engine.wasm)
// Motivation: デバイスを傾けてrotationXが90°を超えた時にエンジン音が鳴る
let lastTriggerTime = 0;
const TRIGGER_COOLDOWN = 200; // milliseconds to prevent continuous triggering
const ROTATION_X_THRESHOLD = 90.0;

function rotationChange(rotx, roty, rotz) {
    if (rotx === null) {
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

// Play engine sound when rotationX exceeds 90°
// Uses /engine/gate parameter as a gate (0/1)
// Note: Parameter name may vary, check console for available parameters
function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Try common parameter names for engine
    // The actual parameter name may be different, check console output
    const gateParam = "/engine/gate";
    dspNode.setParamValue(gateParam, 1);
    setTimeout(() => { 
        dspNode.setParamValue(gateParam, 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================