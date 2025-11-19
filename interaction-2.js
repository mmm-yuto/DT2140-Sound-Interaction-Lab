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

// Change here to ("churchBell") depending on your wasm file name
// NOTE: You need to compile churchBell.dsp using Faust IDE to generate churchBell.wasm
const dspName = "churchBell";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change churchBell with your wasm file name
churchBell.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Check churchBell parameters min/max values for safety
        // ChurchBell parameters: gate, etc.
        const churchBellGateParam = findByAddress(dspNodeParams, "/churchBell/gate");
        if (churchBellGateParam) {
            const [minValue, maxValue] = getParamMinMax(churchBellGateParam);
            console.log('ChurchBell/gate - Min value:', minValue, 'Max value:', maxValue);
        }
        // If gate parameter doesn't exist, check for other common parameters
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
    // Not used for this interaction
}

// Mapping 2: Shake (vertical) → Church Bell
// Gesture: スマートフォンを縦に持って振る
// Sound: Church Bell (churchBell.wasm)
// Motivation: 教会の鐘を鳴らす動作（縦方向に振る）を、スマートフォンを縦に持って振る動作で表現
function rotationChange(rotx, roty, rotz) {
    // Check if device is held vertically (portrait orientation)
    // rotationY (Pitch) should be around 90° or -90° for vertical
    // Allow some tolerance: 60° to 120° or -120° to -60°
    const isVertical = (roty !== null && (
        (roty >= 60 && roty <= 120) || 
        (roty >= -120 && roty <= -60)
    ));
    
    // Store vertical state for use in deviceShaken()
    window.isDeviceVertical = isVertical;
}

function mousePressed() {
    // playAudio()
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
// Mapping 2: Shake (vertical) → Church Bell
// Gesture: スマートフォンを縦に持って振る
// Sound: Church Bell (churchBell.wasm)
// Motivation: 教会の鐘を鳴らす動作（縦方向に振る）を、スマートフォンを縦に持って振る動作で表現
function deviceShaken() {
    // Only trigger if device is held vertically
    if (window.isDeviceVertical) {
        shaketimer = millis();
        statusLabels[0].style("color", "pink");
        playAudio();
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

// Play church bell sound when device is shaken vertically
// Uses /churchBell/gate parameter as a gate (0/1)
// Note: Parameter name may vary, check console for available parameters
function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Try common parameter names for church bell
    // The actual parameter name may be different, check console output
    const gateParam = "/churchBell/gate";
    dspNode.setParamValue(gateParam, 1);
    setTimeout(() => { 
        dspNode.setParamValue(gateParam, 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================