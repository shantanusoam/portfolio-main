import { useState, useEffect } from 'react';
import useSound from 'use-sound';

const useConditionalSound = (url, options) => {
  const [playSound, setPlaySound] = useState(null);

  useEffect(() => {
    if (options.soundEnabled) {
      const [play, soundOptions] = useSound(url, options);
      setPlaySound(() => play);
    } else {
      setPlaySound(() => () => {});
    }
  }, [options.soundEnabled]);

  return [playSound, options];
};

export default useConditionalSound;
