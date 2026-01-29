'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSound from 'use-sound';

export type SoundKey =
  | 'agent-interrupt'
  | 'bind'
  | 'block'
  | 'bounce'
  | 'clock-up-field'
  | 'clock-up'
  | 'copied'
  | 'copying'
  | 'cp-consume'
  | 'cp-increase'
  | 'damage'
  | 'deactive'
  | 'deleted'
  | 'draw'
  | 'drive'
  | 'effect'
  | 'evolve'
  | 'fortitude'
  | 'grow'
  | 'guard'
  | 'leave'
  | 'open'
  | 'oracle'
  | 'overheat'
  | 'penetrate'
  | 'purple-consume'
  | 'purple-increase'
  | 'reboot'
  | 'recover'
  | 'bang'
  | 'silent'
  | 'speedmove'
  | 'trash'
  | 'trigger'
  | 'unblockable'
  | 'withdrawal'
  | 'cancel'
  | 'close'
  | 'choices'
  | 'decide'
  | 'joker-drive'
  | 'joker-grow'
  | 'select';

interface SoundManagerContextType {
  play: (soundId: string) => void;
  playBgm: () => Promise<void>;
  stopBgm: () => void;
  isAudioReady: boolean;
  setBgmVolume: (volume: number) => void;
  getBgmVolume: () => number;
  isBgmPlaying: () => boolean;
}

// Define a sound configuration map with path for each sound key
// Makes it easier to add new sounds or modify paths
const SOUND_CONFIG: Record<SoundKey, { path: string; volume: number }> = {
  'agent-interrupt': {
    path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/agent-interrupt.ogg`,
    volume: 0.25,
  },
  bind: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/bind.ogg`, volume: 0.25 },
  block: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/block.ogg`, volume: 0.25 },
  bounce: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/bounce.ogg`, volume: 0.25 },
  'clock-up-field': {
    path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/clock-up-field.ogg`,
    volume: 0.25,
  },
  'clock-up': { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/clock-up.ogg`, volume: 0.25 },
  copied: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/copied.ogg`, volume: 0.25 },
  copying: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/copying.ogg`, volume: 0.25 },
  'cp-consume': { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/cp-consume.ogg`, volume: 0.25 },
  'cp-increase': { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/cp-increase.ogg`, volume: 0.25 },
  damage: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/damage.ogg`, volume: 0.25 },
  deactive: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/deactive.ogg`, volume: 0.25 },
  deleted: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/deleted.ogg`, volume: 0.25 },
  draw: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/draw.ogg`, volume: 0.25 },
  drive: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/drive.ogg`, volume: 0.25 },
  effect: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/effect.ogg`, volume: 0.25 },
  evolve: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/evolve.ogg`, volume: 0.25 },
  fortitude: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/fortitude.ogg`, volume: 0.25 },
  grow: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/grow.ogg`, volume: 0.25 },
  guard: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/guard.ogg`, volume: 0.25 },
  leave: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/leave.ogg`, volume: 0.25 },
  open: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/open-trash.ogg`, volume: 0.25 },
  oracle: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/oracle.ogg`, volume: 0.25 },
  overheat: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/overheat.ogg`, volume: 0.25 },
  penetrate: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/penetrate.ogg`, volume: 0.25 },
  'purple-consume': {
    path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/purple-consume.ogg`,
    volume: 0.25,
  },
  'purple-increase': {
    path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/purple-increase.ogg`,
    volume: 0.25,
  },
  reboot: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/reboot.ogg`, volume: 0.25 },
  recover: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/recover.ogg`, volume: 0.25 },
  bang: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/bang.ogg`, volume: 0.25 },
  silent: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/silent.ogg`, volume: 0.25 },
  speedmove: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/speedmove.ogg`, volume: 0.25 },
  trash: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/trash.ogg`, volume: 0.25 },
  trigger: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/trigger.ogg`, volume: 0.25 },
  unblockable: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/unblockable.ogg`, volume: 0.25 },
  withdrawal: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/withdrawal.ogg`, volume: 0.25 },
  cancel: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/cancel.ogg`, volume: 0.25 },
  close: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/close.ogg`, volume: 0.25 },
  choices: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/choice.ogg`, volume: 0.25 },
  decide: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/decide.ogg`, volume: 0.25 },
  'joker-drive': { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/joker-drive.ogg`, volume: 0.25 },
  'joker-grow': { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/joker-grow.ogg`, volume: 0.25 },
  select: { path: `${process.env.NEXT_PUBLIC_SOUNDPATH}/select.ogg`, volume: 0.25 },
};

// Create the context with a default value
export const SoundManagerV2Context = createContext<SoundManagerContextType | undefined>(undefined);

export const SoundManagerV2Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);
  const soundInstancesRef = useRef<Map<string, { play: () => void; stop: () => void }>>(new Map());
  const activeSoundsRef = useRef<Map<string, () => void>>(new Map());
  const activeBgmRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmGainNodeRef = useRef<GainNode | null>(null);
  const bgmVolumeRef = useRef<number>(0.5); // Default volume at 50%
  const pendingSoundsRef = useRef<string[]>([]);

  // Initialize volume from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('bgmVolume');
      if (savedVolume) {
        const volume = parseFloat(savedVolume);
        if (!isNaN(volume) && volume >= 0 && volume <= 1) {
          bgmVolumeRef.current = volume;
        }
      }
    }
  }, []);

  // Setup the AudioContext for BGM and monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeAudio = () => {
      if (audioInitializedRef.current) return;

      try {
        // Create a single AudioContext for the application
        if (!audioContextRef.current && window.AudioContext) {
          audioContextRef.current = new AudioContext();
        }

        // Check if context is in suspended state (browser autoplay policy)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          void audioContextRef.current.resume();
        }

        setIsAudioReady(true);
        audioInitializedRef.current = true;

        // Process any pending sounds
        while (pendingSoundsRef.current.length > 0) {
          const soundId = pendingSoundsRef.current.shift();
          if (soundId) {
            playSoundById(soundId);
          }
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    // Try to initialize audio immediately (will work if autoplay policy allows)
    initializeAudio();

    // Set up user interaction listeners to initialize audio
    const userInteractionEvents = ['click', 'touchstart', 'keydown', 'touchend'];

    const handleUserInteraction = () => {
      initializeAudio();

      // Clean up event listeners after successful initialization
      if (audioInitializedRef.current) {
        userInteractionEvents.forEach(event => {
          window.removeEventListener(event, handleUserInteraction);
        });
      }
    };

    // Add event listeners for user interaction
    userInteractionEvents.forEach(event => {
      window.addEventListener(event, handleUserInteraction);
    });

    // Cleanup function
    return () => {
      userInteractionEvents.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  // We need to call useSound for each sound effect to comply with React's rules of hooks
  // Direct calls to useSound for each sound key - using our config for consistency
  // The pattern is much cleaner but still complies with React hook rules

  // Call useSound for each sound - each call must be at the top level
  // This approach satisfies React Hooks rules while making it easy to add new sounds
  // Just add a new key to SoundKey type and SOUND_CONFIG, and it will automatically be included here
  const [agentInterruptPlay, agentInterruptControls] = useSound(
    SOUND_CONFIG['agent-interrupt'].path,
    { volume: SOUND_CONFIG['agent-interrupt'].volume }
  );
  const [bindPlay, bindControls] = useSound(SOUND_CONFIG['bind'].path, {
    volume: SOUND_CONFIG['bind'].volume,
  });
  const [blockPlay, blockControls] = useSound(SOUND_CONFIG['block'].path, {
    volume: SOUND_CONFIG['block'].volume,
  });
  const [bouncePlay, bounceControls] = useSound(SOUND_CONFIG['bounce'].path, {
    volume: SOUND_CONFIG['bounce'].volume,
  });
  const [clockUpFieldPlay, clockUpFieldControls] = useSound(SOUND_CONFIG['clock-up-field'].path, {
    volume: SOUND_CONFIG['clock-up-field'].volume,
  });
  const [clockUpPlay, clockUpControls] = useSound(SOUND_CONFIG['clock-up'].path, {
    volume: SOUND_CONFIG['clock-up'].volume,
  });
  const [copiedPlay, copiedControls] = useSound(SOUND_CONFIG['copied'].path, {
    volume: SOUND_CONFIG['copied'].volume,
  });
  const [copyingPlay, copyingControls] = useSound(SOUND_CONFIG['copying'].path, {
    volume: SOUND_CONFIG['copying'].volume,
  });
  const [cpConsumePlay, cpConsumeControls] = useSound(SOUND_CONFIG['cp-consume'].path, {
    volume: SOUND_CONFIG['cp-consume'].volume,
  });
  const [cpIncreasePlay, cpIncreaseControls] = useSound(SOUND_CONFIG['cp-increase'].path, {
    volume: SOUND_CONFIG['cp-increase'].volume,
  });
  const [damagePlay, damageControls] = useSound(SOUND_CONFIG['damage'].path, {
    volume: SOUND_CONFIG['damage'].volume,
  });
  const [deactivePlay, deactiveControls] = useSound(SOUND_CONFIG['deactive'].path, {
    volume: SOUND_CONFIG['deactive'].volume,
  });
  const [deletedPlay, deletedControls] = useSound(SOUND_CONFIG['deleted'].path, {
    volume: SOUND_CONFIG['deleted'].volume,
  });
  const [drawPlay, drawControls] = useSound(SOUND_CONFIG['draw'].path, {
    volume: SOUND_CONFIG['draw'].volume,
  });
  const [drivePlay, driveControls] = useSound(SOUND_CONFIG['drive'].path, {
    volume: SOUND_CONFIG['drive'].volume,
  });
  const [effectPlay, effectControls] = useSound(SOUND_CONFIG['effect'].path, {
    volume: SOUND_CONFIG['effect'].volume,
  });
  const [evolvePlay, evolveControls] = useSound(SOUND_CONFIG['evolve'].path, {
    volume: SOUND_CONFIG['evolve'].volume,
  });
  const [fortitudePlay, fortitudeControls] = useSound(SOUND_CONFIG['fortitude'].path, {
    volume: SOUND_CONFIG['fortitude'].volume,
  });
  const [growPlay, growControls] = useSound(SOUND_CONFIG['grow'].path, {
    volume: SOUND_CONFIG['grow'].volume,
  });
  const [guardPlay, guardControls] = useSound(SOUND_CONFIG['guard'].path, {
    volume: SOUND_CONFIG['guard'].volume,
  });
  const [leavePlay, leaveControls] = useSound(SOUND_CONFIG['leave'].path, {
    volume: SOUND_CONFIG['leave'].volume,
  });
  const [openPlay, openControls] = useSound(SOUND_CONFIG['open'].path, {
    volume: SOUND_CONFIG['open'].volume,
  });
  const [oraclePlay, oracleControls] = useSound(SOUND_CONFIG['oracle'].path, {
    volume: SOUND_CONFIG['oracle'].volume,
  });
  const [overheatPlay, overheatControls] = useSound(SOUND_CONFIG['overheat'].path, {
    volume: SOUND_CONFIG['overheat'].volume,
  });
  const [penetratePlay, penetrateControls] = useSound(SOUND_CONFIG['penetrate'].path, {
    volume: SOUND_CONFIG['penetrate'].volume,
  });
  const [purpleConsumePlay, purpleConsumeControls] = useSound(SOUND_CONFIG['purple-consume'].path, {
    volume: SOUND_CONFIG['purple-consume'].volume,
  });
  const [purpleIncreasePlay, purpleIncreaseControls] = useSound(
    SOUND_CONFIG['purple-increase'].path,
    { volume: SOUND_CONFIG['purple-increase'].volume }
  );
  const [rebootPlay, rebootControls] = useSound(SOUND_CONFIG['reboot'].path, {
    volume: SOUND_CONFIG['reboot'].volume,
  });
  const [recoverPlay, recoverControls] = useSound(SOUND_CONFIG['recover'].path, {
    volume: SOUND_CONFIG['recover'].volume,
  });
  const [bangPlay, bangControls] = useSound(SOUND_CONFIG['bang'].path, {
    volume: SOUND_CONFIG['bang'].volume,
  });
  const [silentPlay, silentControls] = useSound(SOUND_CONFIG['silent'].path, {
    volume: SOUND_CONFIG['silent'].volume,
  });
  const [speedmovePlay, speedmoveControls] = useSound(SOUND_CONFIG['speedmove'].path, {
    volume: SOUND_CONFIG['speedmove'].volume,
  });
  const [trashPlay, trashControls] = useSound(SOUND_CONFIG['trash'].path, {
    volume: SOUND_CONFIG['trash'].volume,
  });
  const [triggerPlay, triggerControls] = useSound(SOUND_CONFIG['trigger'].path, {
    volume: SOUND_CONFIG['trigger'].volume,
  });
  const [unblockablePlay, unblockableControls] = useSound(SOUND_CONFIG['unblockable'].path, {
    volume: SOUND_CONFIG['unblockable'].volume,
  });
  const [withdrawalPlay, withdrawalControls] = useSound(SOUND_CONFIG['withdrawal'].path, {
    volume: SOUND_CONFIG['withdrawal'].volume,
  });
  const [cancelPlay, cancelControls] = useSound(SOUND_CONFIG['cancel'].path, {
    volume: SOUND_CONFIG['cancel'].volume,
  });
  const [closePlay, closeControls] = useSound(SOUND_CONFIG['close'].path, {
    volume: SOUND_CONFIG['close'].volume,
  });
  const [choicePlay, choiceControls] = useSound(SOUND_CONFIG['choices'].path, {
    volume: SOUND_CONFIG['choices'].volume,
  });
  const [decidePlay, decideControls] = useSound(SOUND_CONFIG['decide'].path, {
    volume: SOUND_CONFIG['decide'].volume,
  });
  const [jokerDrivePlay, jokerDriveControls] = useSound(SOUND_CONFIG['joker-drive'].path, {
    volume: SOUND_CONFIG['joker-drive'].volume,
  });
  const [jokerGrowPlay, jokerGrowControls] = useSound(SOUND_CONFIG['joker-grow'].path, {
    volume: SOUND_CONFIG['joker-grow'].volume,
  });
  const [selectPlay, selectControls] = useSound(SOUND_CONFIG['select'].path, {
    volume: SOUND_CONFIG['select'].volume,
  });

  // Map all sound instances to their IDs - this is still much easier to maintain
  // than the original approach as we have a central config
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear the map first
    soundInstancesRef.current.clear();

    // Add all sound instances to the map by directly referencing each instance
    // This is more explicit than a loop but is still more maintainable
    // Any new sound keys just need to be added here after adding the hook call above
    soundInstancesRef.current.set('agent-interrupt', {
      play: agentInterruptPlay,
      stop: agentInterruptControls.stop,
    });
    soundInstancesRef.current.set('bind', { play: bindPlay, stop: bindControls.stop });
    soundInstancesRef.current.set('block', { play: blockPlay, stop: blockControls.stop });
    soundInstancesRef.current.set('bounce', { play: bouncePlay, stop: bounceControls.stop });
    soundInstancesRef.current.set('clock-up-field', {
      play: clockUpFieldPlay,
      stop: clockUpFieldControls.stop,
    });
    soundInstancesRef.current.set('clock-up', { play: clockUpPlay, stop: clockUpControls.stop });
    soundInstancesRef.current.set('copied', { play: copiedPlay, stop: copiedControls.stop });
    soundInstancesRef.current.set('copying', { play: copyingPlay, stop: copyingControls.stop });
    soundInstancesRef.current.set('cp-consume', {
      play: cpConsumePlay,
      stop: cpConsumeControls.stop,
    });
    soundInstancesRef.current.set('cp-increase', {
      play: cpIncreasePlay,
      stop: cpIncreaseControls.stop,
    });
    soundInstancesRef.current.set('damage', { play: damagePlay, stop: damageControls.stop });
    soundInstancesRef.current.set('deactive', { play: deactivePlay, stop: deactiveControls.stop });
    soundInstancesRef.current.set('deleted', { play: deletedPlay, stop: deletedControls.stop });
    soundInstancesRef.current.set('draw', { play: drawPlay, stop: drawControls.stop });
    soundInstancesRef.current.set('drive', { play: drivePlay, stop: driveControls.stop });
    soundInstancesRef.current.set('effect', { play: effectPlay, stop: effectControls.stop });
    soundInstancesRef.current.set('evolve', { play: evolvePlay, stop: evolveControls.stop });
    soundInstancesRef.current.set('fortitude', {
      play: fortitudePlay,
      stop: fortitudeControls.stop,
    });
    soundInstancesRef.current.set('grow', { play: growPlay, stop: growControls.stop });
    soundInstancesRef.current.set('guard', { play: guardPlay, stop: guardControls.stop });
    soundInstancesRef.current.set('leave', { play: leavePlay, stop: leaveControls.stop });
    soundInstancesRef.current.set('open', { play: openPlay, stop: openControls.stop });
    soundInstancesRef.current.set('oracle', { play: oraclePlay, stop: oracleControls.stop });
    soundInstancesRef.current.set('overheat', { play: overheatPlay, stop: overheatControls.stop });
    soundInstancesRef.current.set('penetrate', {
      play: penetratePlay,
      stop: penetrateControls.stop,
    });
    soundInstancesRef.current.set('purple-consume', {
      play: purpleConsumePlay,
      stop: purpleConsumeControls.stop,
    });
    soundInstancesRef.current.set('purple-increase', {
      play: purpleIncreasePlay,
      stop: purpleIncreaseControls.stop,
    });
    soundInstancesRef.current.set('reboot', { play: rebootPlay, stop: rebootControls.stop });
    soundInstancesRef.current.set('recover', { play: recoverPlay, stop: recoverControls.stop });
    soundInstancesRef.current.set('bang', { play: bangPlay, stop: bangControls.stop });
    soundInstancesRef.current.set('silent', { play: silentPlay, stop: silentControls.stop });
    soundInstancesRef.current.set('speedmove', {
      play: speedmovePlay,
      stop: speedmoveControls.stop,
    });
    soundInstancesRef.current.set('trash', { play: trashPlay, stop: trashControls.stop });
    soundInstancesRef.current.set('trigger', { play: triggerPlay, stop: triggerControls.stop });
    soundInstancesRef.current.set('unblockable', {
      play: unblockablePlay,
      stop: unblockableControls.stop,
    });
    soundInstancesRef.current.set('withdrawal', {
      play: withdrawalPlay,
      stop: withdrawalControls.stop,
    });
    soundInstancesRef.current.set('cancel', { play: cancelPlay, stop: cancelControls.stop });
    soundInstancesRef.current.set('close', { play: closePlay, stop: closeControls.stop });
    soundInstancesRef.current.set('choices', { play: choicePlay, stop: choiceControls.stop });
    soundInstancesRef.current.set('decide', { play: decidePlay, stop: decideControls.stop });
    soundInstancesRef.current.set('joker-drive', {
      play: jokerDrivePlay,
      stop: jokerDriveControls.stop,
    });
    soundInstancesRef.current.set('joker-grow', {
      play: jokerGrowPlay,
      stop: jokerGrowControls.stop,
    });
    soundInstancesRef.current.set('select', { play: selectPlay, stop: selectControls.stop });
  }, [
    agentInterruptPlay,
    agentInterruptControls,
    bindPlay,
    bindControls,
    blockPlay,
    blockControls,
    bouncePlay,
    bounceControls,
    clockUpFieldPlay,
    clockUpFieldControls,
    clockUpPlay,
    clockUpControls,
    copiedPlay,
    copiedControls,
    copyingPlay,
    copyingControls,
    cpConsumePlay,
    cpConsumeControls,
    cpIncreasePlay,
    cpIncreaseControls,
    damagePlay,
    damageControls,
    deactivePlay,
    deactiveControls,
    deletedPlay,
    deletedControls,
    drawPlay,
    drawControls,
    drivePlay,
    driveControls,
    effectPlay,
    effectControls,
    evolvePlay,
    evolveControls,
    fortitudePlay,
    fortitudeControls,
    growPlay,
    growControls,
    guardPlay,
    guardControls,
    leavePlay,
    leaveControls,
    openPlay,
    openControls,
    oraclePlay,
    oracleControls,
    overheatPlay,
    overheatControls,
    penetratePlay,
    penetrateControls,
    purpleConsumePlay,
    purpleConsumeControls,
    purpleIncreasePlay,
    purpleIncreaseControls,
    rebootPlay,
    rebootControls,
    recoverPlay,
    recoverControls,
    bangPlay,
    bangControls,
    silentPlay,
    silentControls,
    speedmovePlay,
    speedmoveControls,
    trashPlay,
    trashControls,
    triggerPlay,
    triggerControls,
    unblockablePlay,
    unblockableControls,
    withdrawalPlay,
    withdrawalControls,
    cancelPlay,
    cancelControls,
    closePlay,
    closeControls,
    choicePlay,
    choiceControls,
    decidePlay,
    decideControls,
    jokerDrivePlay,
    jokerDriveControls,
    jokerGrowPlay,
    jokerGrowControls,
    selectPlay,
    selectControls,
  ]);

  // Internal function to play sound by ID
  const playSoundById = useCallback(
    (soundId: string) => {
      // Check if audio is ready
      if (!isAudioReady) {
        // Add to pending sounds queue if not ready
        pendingSoundsRef.current.push(soundId);
        return;
      }

      // Get the sound instance
      const soundInstance = soundInstancesRef.current.get(soundId);
      if (!soundInstance) {
        console.warn(`Sound not found: ${soundId}`);
        return;
      }

      // Stop the same sound if it's already playing
      if (activeSoundsRef.current.has(soundId)) {
        activeSoundsRef.current.get(soundId)?.();
        activeSoundsRef.current.delete(soundId);
      }

      // Play the sound and track it
      soundInstance.play();
      activeSoundsRef.current.set(soundId, soundInstance.stop);

      console.log(`%c Sound played: ${soundId}`, 'color: #8bc34a');
    },
    [isAudioReady]
  );

  // Public API: play sound by ID
  const play = useCallback(
    (soundId: string) => {
      playSoundById(soundId);
    },
    [playSoundById]
  );

  // Function to play BGM
  const playBgm = useCallback(async () => {
    console.log('PlayBgm called, checking audioContext...');
    if (!audioContextRef.current) {
      console.error('AudioContext not available');
      try {
        // Try creating an audio context if it doesn't exist
        audioContextRef.current = new window.AudioContext();
        console.log('Created new AudioContext');
      } catch (err) {
        console.error('Failed to create AudioContext:', err);
        return;
      }
    }

    try {
      console.log('AudioContext state:', audioContextRef.current.state);

      // Stop any currently playing BGM
      if (activeBgmRef.current) {
        console.log('Stopping currently playing BGM');
        activeBgmRef.current.stop();
        activeBgmRef.current = null;
      }

      // Make sure audio context is resumed
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended AudioContext');
        await audioContextRef.current.resume();
        console.log('AudioContext resumed successfully');
      }

      console.log('Fetching BGM file...');
      const fetchResponse = await fetch('/sound/bgm/Quiet Madness.wav');
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch BGM: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      const buffer = await fetchResponse.arrayBuffer();
      console.log('BGM file fetched, decoding audio...');

      const audio = await audioContextRef.current.decodeAudioData(buffer);
      console.log('Audio decoded successfully, creating source node');

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audio;
      source.loop = true;
      source.loopStart = 0; // Loop start position (seconds)
      source.loopEnd = 124.235; // Loop end position (seconds)

      // Create gain node for volume control
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = bgmVolumeRef.current;
      console.log('Setting BGM volume to:', bgmVolumeRef.current);

      // Connect source -> gainNode -> destination
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      console.log('Starting BGM playback');
      source.start();

      // Store references
      activeBgmRef.current = source;
      bgmGainNodeRef.current = gainNode;
      console.log('BGM playback started successfully');
    } catch (error) {
      console.error('Error playing BGM:', error);
      throw error; // Re-throw so callers can handle it
    }
  }, []);

  // Function to stop BGM
  const stopBgm = useCallback(() => {
    if (activeBgmRef.current) {
      activeBgmRef.current.stop();
      activeBgmRef.current = null;
    }

    // Properly disconnect and clean up the gain node
    if (bgmGainNodeRef.current) {
      bgmGainNodeRef.current.disconnect();
      bgmGainNodeRef.current = null;
    }

    console.log('BGM stopped and cleaned up');
  }, []);

  // Function to check if BGM is currently playing
  const isBgmPlaying = useCallback(() => {
    return activeBgmRef.current !== null;
  }, []);

  // Function to set BGM volume
  const setBgmVolume = useCallback((volume: number) => {
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Update volume ref
    bgmVolumeRef.current = clampedVolume;

    // Apply to current BGM if playing
    if (bgmGainNodeRef.current) {
      bgmGainNodeRef.current.gain.value = clampedVolume;
    }

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('bgmVolume', clampedVolume.toString());
    }
  }, []);

  // Function to get current BGM volume
  const getBgmVolume = useCallback(() => {
    return bgmVolumeRef.current;
  }, []);

  const value = useMemo(
    () => ({
      play,
      playBgm,
      stopBgm,
      isAudioReady,
      setBgmVolume,
      getBgmVolume,
      isBgmPlaying,
    }),
    [play, playBgm, stopBgm, isAudioReady, setBgmVolume, getBgmVolume, isBgmPlaying]
  );

  return <SoundManagerV2Context.Provider value={value}>{children}</SoundManagerV2Context.Provider>;
};

// Hook to use the sound manager
export const useSoundManagerV2 = (): SoundManagerContextType => {
  const context = useContext(SoundManagerV2Context);
  if (context === undefined) {
    throw new Error('useSoundManagerV2 must be used within a SoundManagerV2Provider');
  }
  return context;
};
