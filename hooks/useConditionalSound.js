import { useState, useEffect } from 'react';
import useSound from 'use-sound';

const useConditionalSound = (url, options) => {
  const [play, soundOptions] = useSound(url, options);
  const [playSound, setPlaySound] = useState(() => () => {});
  const [stopSound, setStopSound] = useState(() => () => {});

  useEffect(() => {
    if (options.soundEnabled) {
      setPlaySound(() => play);
      setStopSound(() => soundOptions.stop);
    } else {
      setPlaySound(() => () => {});
      setStopSound(() => () => {});
    }
  }, [options.soundEnabled]);

  return [playSound, { ...options, stop: stopSound }];
};
export default useConditionalSound;
