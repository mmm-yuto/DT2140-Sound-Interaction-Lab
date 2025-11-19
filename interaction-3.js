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

// Change here to ("marimbaMIDI") depending on your wasm file name
// NOTE: You need to compile marimbaMIDI.dsp using Faust IDE to generate marimbaMIDI.wasm
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

// The name should be the same as the WASM file, so change marimbaMIDI with your wasm file name
// NOTE: If marimbaMIDI.wasm doesn't exist, this will fail. You need to compile marimbaMIDI.dsp using Faust IDE.
marimbaMIDI.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('MarimbaMIDI DSP loaded successfully');
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // Check marimbaMIDI parameters min/max values for safety
        // MarimbaMIDI parameters: gate, note, velocity, etc.
        const marimbaGateParam = findByAddress(dspNodeParams, "/marimbaMIDI/gate");
        const marimbaNoteParam = findByAddress(dspNodeParams, "/marimbaMIDI/note");
        if (marimbaGateParam) {
            const [minValue, maxValue] = getParamMinMax(marimbaGateParam);
            console.log('MarimbaMIDI/gate - Min value:', minValue, 'Max value:', maxValue);
        }
        if (marimbaNoteParam) {
            const [minValue, maxValue] = getParamMinMax(marimbaNoteParam);
            console.log('MarimbaMIDI/note - Min value:', minValue, 'Max value:', maxValue);
        }
        // If parameters don't exist, check for other common parameters
        console.log('Available parameters:', dspNode.getParams());
    })
    .catch(error => {
        console.error('Failed to load marimbaMIDI.wasm:', error);
        console.error('Please compile marimbaMIDI.dsp using Faust IDE to generate marimbaMIDI.wasm');
        alert('Error: marimbaMIDI.wasm not found. Please compile marimbaMIDI.dsp using Faust IDE and place marimbaMIDI.wasm in the project root.');
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

// Mapping 3: Strike motion → Marimba
// Gesture: accelerationXの絶対値が2を超えた時に音がなる
// Sound: Marimba (marimbaMIDI.wasm)
// Motivation: マリンバをスティックでたたく動作を、デバイスを急激に動かす（たたくような）動作で表現

let lastStrikeTime = 0;
const STRIKE_COOLDOWN = 200; // milliseconds to prevent continuous triggering
const ACCELERATION_X_THRESHOLD = 2.0; // threshold for accelerationX absolute value

function accelerationChange(accx, accy, accz) {
    // Check if absolute value of accelerationX exceeds threshold
    const absAccX = Math.abs(accx);
    
    if (absAccX > ACCELERATION_X_THRESHOLD) {
        const currentTime = millis();
        // Prevent continuous triggering with cooldown
        if (currentTime - lastStrikeTime > STRIKE_COOLDOWN) {
            playAudio();
            lastStrikeTime = currentTime;
        }
    }
}

function rotationChange(rotx, roty, rotz) {
    // Not used for this interaction
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
    // Removed playAudio() call - this interaction uses Strike motion, not Shake
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

// Play marimba sound when strike motion is detected
// Uses /marimbaMIDI/gate parameter and optionally /marimbaMIDI/note for different pitches
// Note: Parameter names may vary, check console for available parameters
function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Try common parameter names for marimba MIDI
    // The actual parameter names may be different, check console output
    const gateParam = "/marimbaMIDI/gate";
    const noteParam = "/marimbaMIDI/note";
    
    // Trigger marimba sound with gate
    dspNode.setParamValue(gateParam, 1);
    
    // Optionally set a note (MIDI note number, e.g., 60 = C4)
    // You can randomize or vary the note for different pitches
    const midiNote = 60 + Math.floor(Math.random() * 12); // C4 to C5 range
    dspNode.setParamValue(noteParam, midiNote);
    
    // Keep gate on for a short duration
    setTimeout(() => { 
        dspNode.setParamValue(gateParam, 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================