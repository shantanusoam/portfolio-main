import { useEffect, useRef } from 'react';

const useOnWindowResize = (fn, delay = 100) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleWindowResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(fn, delay);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      // Cleanup on unmount.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [fn, delay]);
};

export default useOnWindowResize;
