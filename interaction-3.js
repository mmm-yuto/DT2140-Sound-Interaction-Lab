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
const dspName = "marimbaMIDI";
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
        // Check marimba parameters min/max values for safety
        // Marimba parameters: gate, midi/freq, midi/gain, etc.
        const marimbaGateParam = findByAddress(dspNodeParams, "/marimba/gate");
        const marimbaFreqParam = findByAddress(dspNodeParams, "/marimba/midi/freq");
        if (marimbaGateParam) {
            const [minValue, maxValue] = getParamMinMax(marimbaGateParam);
            console.log('marimba/gate - Min value:', minValue, 'Max value:', maxValue);
        }
        if (marimbaFreqParam) {
            const [minValue, maxValue] = getParamMinMax(marimbaFreqParam);
            console.log('marimba/midi/freq - Min value:', minValue, 'Max value:', maxValue);
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

function accelerationChange(accx, accy, accz) {
    // Not used for this interaction
}

// Mapping 3: Shake → Marimba
// Gesture: Shake the phone
// Sound: Marimba (marimbaMIDI.wasm)
// Motivation: The shaking motion triggers marimba sounds, creating a percussive and musical interaction
function rotationChange(rotx, roty, rotz) {
    // Not used for this interaction
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
// Mapping 3: Shake → Marimba
// Gesture: Shake the phone
// Sound: Marimba (marimbaMIDI.wasm)
// Motivation: The shaking motion triggers marimba sounds, creating a percussive and musical interaction
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    playAudio();
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

// Play marimba sound when device is shaken
// Uses /marimba/gate parameter and /marimba/midi/freq for different pitches
// Note: Actual parameter names: /marimba/gate, /marimba/midi/freq, /marimba/midi/gain, etc.
function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Use actual parameter names from marimbaMIDI.wasm
    const gateParam = "/marimba/gate";
    const freqParam = "/marimba/midi/freq";
    
    // Set frequency (MIDI note to frequency conversion)
    // MIDI note 60 (C4) = 261.63 Hz, MIDI note 72 (C5) = 523.25 Hz
    // Random note between C4 and C5
    const midiNote = 60 + Math.floor(Math.random() * 12); // C4 to C5 range
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12); // Convert MIDI note to frequency
    dspNode.setParamValue(freqParam, frequency);
    
    // Trigger marimba sound with gate
    dspNode.setParamValue(gateParam, 1);
    
    // Keep gate on for a short duration
    setTimeout(() => { 
        dspNode.setParamValue(gateParam, 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================