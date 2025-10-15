# Sound Assets

This directory contains sound files for push notifications and alerts.

## Required Files

### arrival.mp3
A notification sound played when the barber arrives at the customer's location.

**Specifications:**
- Format: MP3
- Duration: 1-3 seconds
- Volume: Normalized to -3dB
- Sample Rate: 44.1 kHz or 48 kHz
- Bit Rate: 128 kbps or higher

**Example Sources:**
1. **Free Sound Libraries:**
   - https://freesound.org/
   - https://soundbible.com/
   - https://mixkit.co/free-sound-effects/

2. **Custom Sound:**
   - Use GarageBand or Audacity to create a custom sound
   - Keep it short, pleasant, and attention-grabbing

3. **Recommended Sound:**
   - A pleasant "ding" or "chime" sound
   - Avoid harsh or jarring sounds
   - Example: "success notification" or "door bell" sounds

## Installation

1. Download or create your `arrival.mp3` file
2. Place it in this directory: `apps/customer/assets/sounds/arrival.mp3`
3. Ensure the file is included in your app bundle by verifying `metro.config.js` asset extensions

## Testing

Test the sound on both iOS and Android devices to ensure:
- Volume is appropriate
- Sound plays correctly
- No distortion or clipping
- Complies with platform notification sound guidelines

## Fallback

If no sound file is provided, the app will fall back to:
- System default notification sound
- Vibration only
- Silent notification (still shows alert)

The arrival notification functionality will still work without the sound file, but the user experience will be enhanced with a custom sound.
