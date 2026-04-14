import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;

export async function playCompletionSound(): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/blim.wav'),
      { shouldPlay: true, volume: 1.0 }
    );
    soundObject = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        soundObject = null;
      }
    });
  } catch (error) {
    console.warn('Error playing sound:', error);
  }
}

export async function unloadSound(): Promise<void> {
  if (soundObject) {
    await soundObject.unloadAsync();
    soundObject = null;
  }
}
