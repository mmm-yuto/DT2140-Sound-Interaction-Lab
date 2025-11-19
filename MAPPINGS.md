# Gesture-to-Sound Mappings

This document describes the three gesture-to-sound mappings implemented for Lab 2: Sound and Gestures in Interaction.

## Table 3: Gesture-to-Sound Mappings

| NUMBER | ACTION | SOUND | MOTIVATION |
| :--- | :--- | :--- | :--- |
| 1 | The phone is held horizontally and shaken | Engine | The action of shaking the phone while held horizontally is mapped to engine sound, where the intensity of shaking directly controls the volume and speed of the engine. The more vigorously you shake, the louder and faster the engine becomes, creating an intuitive mapping between physical effort and engine RPM. Use case: racing games, vehicle simulators, or interactive sound installations where users control engine sounds through physical gesture. |
| 2 | The phone is held vertically and shaken | Church Bell | The action of shaking the phone while held vertically mimics the physical motion of ringing a bell by pulling a rope downward. This creates a natural connection between vertical shaking movements and bell ringing, recreating the traditional bell-ringing motion in a digital context. Use case: meditation apps, church bell simulators, or interactive musical instruments. |
| 3 | The phone is used to make a striking motion (like hitting with a stick) | Marimba | The striking motion of the device (sudden, sharp acceleration changes) is mapped to marimba sounds. Each strike produces a different pitch, creating a percussive interaction that mimics striking marimba bars with mallets. Use case: virtual marimba apps, music education tools, or interactive percussion instruments where users play through natural striking gestures. |

## Detailed Implementation

### Mapping 1: Shake (Horizontal) → Engine

**Gesture Detection:**
- Uses p5.js's built-in `deviceShaken()` function combined with orientation detection
- `rotationChange()` function checks if device is held horizontally (rotationY between -30° to 30° or 150° to -150°)
- `accelerationChange()` function calculates shake intensity based on acceleration change
- Only triggers when device is held horizontally AND shaken

**Sound Control:**
- Sound: Engine (engine.wasm)
- Parameters: `/engine/gate` (gate: 0/1), `/engine/volume` (0.0-1.0), `/engine/maxSpeed` (0.0-1.0)
- Implementation: 
  - When horizontal shake is detected, gate is set to 1
  - Volume and maxSpeed are mapped from shake intensity (0.3-1.0 for volume, 0.1-1.0 for maxSpeed)
  - Gate is reset to 0 after 100ms

**Technical Details:**
- File: `interaction-1.js`
- The `deviceShaken()` function checks `window.isDeviceHorizontal` before triggering
- The `playAudio(shakeIntensity)` function receives shake intensity and maps it to volume/speed
- Shake intensity is calculated as the Euclidean distance of acceleration change

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

