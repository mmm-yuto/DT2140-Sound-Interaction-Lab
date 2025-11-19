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

// Change here to ("tuono") depending on your wasm file name
const dspName = "brass";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
brass.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Check brass/blower/pressure parameter min/max values for safety
        const brassParam = findByAddress(dspNodeParams, "/brass/blower/pressure");
        if (brassParam) {
            const [minValue, maxValue] = getParamMinMax(brassParam);
            console.log('Brass/blower/pressure - Min value:', minValue, 'Max value:', maxValue);
        }
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

// Mapping 3: Tilt side to side → Brass
// Gesture: The phone is placed flat and tilted from side to side
// Sound: Brass (brass.wasm)
// Motivation: The breath strength of a brass instrument is controlled by the tilt of the device
function rotationChange(rotx, roty, rotz) {
    // rotationX (Roll/Gamma) represents the side-to-side tilt
    // -90° to +90° range represents the tilt angle
    // Normalize to 0.0 to 1.0 range for pressure parameter
    if (rotx !== null) {
        // Clamp rotationX to -90° to +90° range
        const clampedAngle = Math.max(-90, Math.min(90, rotx));
        // Normalize from -90° to +90° to 0.0 to 1.0
        // When rotx = -90°, pressure = 0.0
        // When rotx = 0°, pressure = 0.5
        // When rotx = +90°, pressure = 1.0
        const normalizedPressure = (clampedAngle + 90) / 180;
        playAudio(normalizedPressure);
    }
}

function mousePressed() {
    playAudio(mouseX/windowWidth)
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
    // Removed playAudio() call - this interaction uses Tilt side to side, not Shake
    // playAudio();
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

// Play brass sound with pressure controlled by device tilt
// Uses /brass/blower/pressure parameter (continuous value 0.0 to 1.0)
// Pressure is mapped from device tilt angle (rotationX)
function playAudio(pressure) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Clamp pressure to valid range (0.0 to 1.0) for safety
    const clampedPressure = Math.max(0.0, Math.min(1.0, pressure));
    dspNode.setParamValue("/brass/blower/pressure", clampedPressure);
}

//==========================================================================================
// END
//==========================================================================================