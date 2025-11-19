# Notification Sounds

## Current Implementation
The app currently uses a free online notification sound (bell-ringing-05.mp3 from soundjay.com).

## Adding a Custom Notification Sound

To use a custom notification sound instead:

1. **Add your sound file** to this directory (`apps/partner/assets/sounds/`)
   - Recommended: `notification.mp3` or `notification.wav`
   - Keep file size small (< 100KB) for faster loading
   - Duration: 1-3 seconds is ideal for notifications

2. **Update the code** in `apps/partner/app/(tabs)/jobs.tsx`:
   ```typescript
   // Replace this line (around line 110):
   const { sound } = await Audio.Sound.createAsync(
     { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
     { shouldPlay: false, volume: 1.0 }
   );
   
   // With:
   const { sound } = await Audio.Sound.createAsync(
     require('../../assets/sounds/notification.mp3'),
     { shouldPlay: false, volume: 1.0 }
   );
   ```

## Sound Recommendations
- **Format**: MP3 or WAV
- **Duration**: 1-3 seconds
- **Volume**: Pre-normalized (not too loud)
- **Style**: Clear, distinctive notification sound (like Grab/Uber)
- **Free Sources**:
  - https://freesound.org/
  - https://www.zapsplat.com/
  - https://mixkit.co/free-sound-effects/notification/

## Testing
After adding a custom sound:
1. Rebuild the app: `npm run android` or `npm run ios`
2. Test by creating a new booking from customer app
3. Verify sound plays along with vibration
