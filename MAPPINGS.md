# Gesture-to-Sound Mappings

This document describes the three gesture-to-sound mappings implemented for Lab 2: Sound and Gestures in Interaction.

## Table 3: Gesture-to-Sound Mappings

| NUMBER | ACTION | SOUND | MOTIVATION |
| :--- | :--- | :--- | :--- |
| 1 | The phone is shaken | Thunder | The impactful sound of thunder is expressed through the action of shaking the phone. This mapping creates an intuitive connection between sudden physical movements and powerful sounds, similar to how thunder occurs with sudden atmospheric changes. Use case: weather applications, games, or interactive sound installations where users can "summon" thunder through physical gesture. |
| 2 | The phone is used to point straight up | Bells | The action of raising the device upward mimics the physical motion of pulling a bell rope upward, creating a natural and intuitive connection between gesture and sound. This mapping is motivated by the cultural and physical association between upward movements and bell ringing. Use case: meditation apps, church bell simulators, or interactive musical instruments. |
| 3 | The phone is placed flat and tilted from side to side | Brass | The side-to-side tilting motion is mapped to the breath pressure control of a brass instrument. This creates a continuous and expressive control mechanism where the tilt angle directly affects the intensity and character of the brass sound. This mapping is motivated by the physical analogy between breath control in brass instruments and the tilting gesture. Use case: virtual brass instrument apps, music education tools, or expressive musical interfaces. |

## Detailed Implementation

### Mapping 1: Shake → Thunder

**Gesture Detection:**
- Uses p5.js's built-in `deviceShaken()` function
- Automatically detects when the phone is shaken based on acceleration thresholds
- The shake threshold can be adjusted via the UI slider

**Sound Control:**
- Sound: Thunder (tuono.wasm)
- Parameter: `/thunder/rumble` (gate: 0/1)
- Implementation: When shake is detected, the gate is set to 1 for 100ms, then reset to 0

**Technical Details:**
- File: `interaction-1.js`
- The `deviceShaken()` function is called automatically by p5.js when shake is detected
- The `playAudio()` function triggers the thunder sound

### Mapping 2: Point Straight Up → Bells

**Gesture Detection:**
- Uses `rotationChange()` function called every frame from `sketch.js`
- Detects when `rotationY` (Pitch/Beta) is in the range of 85° to 95°
- Implements a cooldown mechanism (500ms) to prevent continuous triggering

**Sound Control:**
- Sound: Bells (bells.wasm)
- Parameter: `/englishBell/gate` (gate: 0/1)
- Implementation: When pointing straight up is detected, the gate is set to 1 for 100ms, then reset to 0

**Technical Details:**
- File: `interaction-2.js`
- The `rotationChange()` function checks the pitch angle every frame
- Cooldown prevents the bell from ringing continuously when the device is held at 90°

### Mapping 3: Tilt Side to Side → Brass

**Gesture Detection:**
- Uses `rotationChange()` function called every frame from `sketch.js`
- Detects `rotationX` (Roll/Gamma) which represents side-to-side tilt
- Angle range: -90° to +90°

**Sound Control:**
- Sound: Brass (brass.wasm)
- Parameter: `/brass/blower/pressure` (continuous: 0.0 to 1.0)
- Implementation: The tilt angle is normalized from -90° to +90° to 0.0 to 1.0
  - When `rotationX = -90°`, `pressure = 0.0`
  - When `rotationX = 0°`, `pressure = 0.5`
  - When `rotationX = +90°`, `pressure = 1.0`

**Technical Details:**
- File: `interaction-3.js`
- The `rotationChange()` function continuously maps the tilt angle to pressure
- The pressure value is clamped to the valid range (0.0 to 1.0) for safety
- This creates a continuous, expressive control mechanism

## Design Rationale

All three mappings follow the principle of creating meaningful connections between physical gestures and auditory results:

1. **Shake → Thunder**: Maps sudden motion to sudden sound, creating an intuitive cause-and-effect relationship.

2. **Point Up → Bells**: Maps upward gesture to upward-pulling action (bell rope), leveraging cultural and physical associations.

3. **Tilt → Brass**: Maps continuous gesture (tilt angle) to continuous control (breath pressure), creating an expressive musical interface.

Each mapping has been designed with a specific use case scenario in mind, ensuring that the gesture-sound connection is not arbitrary but serves a meaningful purpose in potential applications.

