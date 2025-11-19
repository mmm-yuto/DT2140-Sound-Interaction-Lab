# Gesture-to-Sound Mappings

This document describes the three gesture-to-sound mappings implemented for Lab 2: Sound and Gestures in Interaction.

## Table 3: Gesture-to-Sound Mappings

| NUMBER | ACTION | SOUND | MOTIVATION |
| :--- | :--- | :--- | :--- |
| 1 | Tilt the device along the X-axis (Roll angle) | Engine | The device's tilt angle (rotationX) controls the engine sound volume through a discrete 5-level system. When the device is held flat (0°), the engine is silent. As the user tilts the device further, the engine volume increases in distinct steps (20%, 40%, 60%, 80%, 100%), creating a clear mapping between physical orientation and sound intensity. This design provides precise, predictable control similar to a throttle or volume knob with discrete positions. Use case: vehicle simulators, racing games, or interactive sound installations where users need to understand the relationship between their physical gesture and the resulting sound output. |
| 2 | The phone is held vertically and shaken | Church Bell | The action of shaking the phone while held vertically mimics the physical motion of ringing a bell by pulling a rope downward. This creates a natural connection between vertical shaking movements and bell ringing, recreating the traditional bell-ringing motion in a digital context. Use case: meditation apps, church bell simulators, or interactive musical instruments. |
| 3 | The phone is used to make a striking motion (like hitting with a stick) | Marimba | The striking motion of the device (sudden, sharp acceleration changes) is mapped to marimba sounds. Each strike produces a different pitch, creating a percussive interaction that mimics striking marimba bars with mallets. Use case: virtual marimba apps, music education tools, or interactive percussion instruments where users play through natural striking gestures. |

## Detailed Implementation

### Mapping 1: Tilt → Engine

**Gesture Detection:**
- Uses `rotationChange()` function called every frame from `sketch.js`
- Detects device tilt angle along X-axis (Roll angle, rotationX)
- Uses absolute value of rotationX to handle both positive and negative angles
- Maps rotationX to 5 discrete volume levels:
  - 0° to 30°: 0% volume (silent)
  - 30° to 60°: 20% volume
  - 60° to 90°: 40% volume
  - 90° to 120°: 60% volume
  - 120° to 150°: 80% volume
  - 150° to 180°: 100% volume (maximum)

**Sound Control:**
- Sound: Engine (engine.wasm)
- Parameters: `/engine/gate` (gate: 0/1), `/engine/volume` (0.0-1.0), `/engine/maxSpeed` (0.0-1.0)
- Implementation: 
  - When rotationX is 0° or in 0-30° range, gate is set to 0 (engine off)
  - When rotationX is in any other valid range, gate is set to 1 (engine on)
  - Volume is mapped to discrete levels (0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
  - Engine volume parameter is calculated as: minVolume (0.1) + (volumeLevel * 0.9)
  - MaxSpeed is also adjusted based on volume level for more realistic engine behavior

**Technical Details:**
- File: `interaction-1.js`
- The `rotationChange(rotx, roty, rotz)` function continuously monitors rotationX
- Uses `Math.abs(rotx)` to handle both positive and negative angles
- Volume levels are discrete (quantized) rather than continuous
- The `playAudio(volume)` function receives the volume level (0.0 to 1.0) and maps it to engine parameters

### Mapping 2: Shake (Vertical) → Church Bell

**Gesture Detection:**
- Uses p5.js's built-in `deviceShaken()` function combined with orientation detection
- `rotationChange()` function checks if device is held vertically (rotationY between 60° to 120° or -120° to -60°)
- Only triggers when device is held vertically AND shaken

**Sound Control:**
- Sound: Church Bell (churchBell.wasm)
- Parameter: `/churchBell/gate` (gate: 0/1)
- Implementation: When vertical shake is detected, the gate is set to 1 for 100ms, then reset to 0

**Technical Details:**
- File: `interaction-2.js`
- The `deviceShaken()` function checks `window.isDeviceVertical` before triggering
- The `rotationChange()` function continuously monitors device orientation
- Vertical orientation is detected when Pitch angle is approximately 90° or -90°

### Mapping 3: Strike Motion → Marimba

**Gesture Detection:**
- Uses `accelerationChange()` function called every frame from `sketch.js`
- Detects sudden, large acceleration changes (strike motion)
- Calculates acceleration change as Euclidean distance: √((Δx)² + (Δy)² + (Δz)²)
- Threshold: acceleration change > 15.0
- Implements a cooldown mechanism (200ms) to prevent continuous triggering

**Sound Control:**
- Sound: Marimba (marimbaMIDI.wasm)
- Parameters: `/marimbaMIDI/gate` (gate: 0/1), `/marimbaMIDI/note` (MIDI note number)
- Implementation: 
  - When strike motion is detected, gate is set to 1
  - MIDI note is randomized between 60-71 (C4 to C5 range) for variety
  - Gate is reset to 0 after 100ms

**Technical Details:**
- File: `interaction-3.js`
- The `accelerationChange()` function continuously monitors acceleration and detects sudden changes
- Previous acceleration values are stored to calculate change
- Cooldown prevents multiple triggers from a single strike motion
- Each strike produces a different pitch for musical variety

## Design Rationale

All three mappings follow the principle of creating meaningful connections between physical gestures and auditory results:

1. **Shake (Horizontal) → Engine**: Maps horizontal shaking motion to engine sound, where physical effort (shake intensity) directly controls engine performance (volume and speed). This creates an intuitive mapping similar to controlling a throttle or accelerator.

2. **Shake (Vertical) → Church Bell**: Maps vertical shaking motion to bell ringing, recreating the traditional physical action of pulling a bell rope. This leverages cultural and physical associations with bell ringing gestures.

3. **Strike Motion → Marimba**: Maps striking gestures (sudden acceleration changes) to percussive marimba sounds, mimicking the physical action of striking marimba bars with mallets. Each strike produces different pitches, creating a musical and expressive interaction.

Each mapping has been designed with a specific use case scenario in mind, ensuring that the gesture-sound connection is not arbitrary but serves a meaningful purpose in potential applications. The orientation-based detection (horizontal vs vertical) adds an additional layer of intentionality to the interactions.

