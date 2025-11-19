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