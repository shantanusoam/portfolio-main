import { useCallback, useEffect, useRef } from 'react';

export function useDebounce(func, delay) {
  const timeoutRef = useRef(null);

  const debouncedFunc = useCallback(
    (...args) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );

  // clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}