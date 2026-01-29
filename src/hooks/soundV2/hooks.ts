'use client';

import { useCallback } from 'react';
import type { SoundKey } from './context';
import { useSoundManagerV2 } from './context';

export const useSoundV2 = () => {
  const { play, playBgm, stopBgm, isAudioReady, setBgmVolume, getBgmVolume, isBgmPlaying } =
    useSoundManagerV2();

  // Simple play function to play a sound by key name
  // This is what users will primarily use
  const playSound = useCallback(
    (key: SoundKey | string) => {
      play(key);
    },
    [play]
  );

  // BGM control functions
  const bgm = useCallback(async () => {
    try {
      console.log('Starting BGM from hook');
      await playBgm();
      console.log('BGM started successfully');
      return {
        start: playBgm, // Allow explicitly starting BGM
        stop: stopBgm, // Allow stopping BGM
      };
    } catch (error) {
      console.error('Error playing BGM:', error);
      throw error;
    }
  }, [playBgm, stopBgm]);

  // Volume control functions
  const setVolume = useCallback(
    (volume: number) => {
      setBgmVolume(volume);
    },
    [setBgmVolume]
  );

  const getVolume = useCallback(() => {
    return getBgmVolume();
  }, [getBgmVolume]);

  // Check if BGM is playing
  const isPlaying = useCallback(() => {
    return isBgmPlaying();
  }, [isBgmPlaying]);

  return {
    // Main function for playing sounds
    play: playSound,

    // BGM controls
    bgm,
    stopBgm,
    isPlaying,

    // Volume controls
    setVolume,
    getVolume,

    // Audio state
    isAudioReady,
  };
};
