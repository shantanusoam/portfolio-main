import { useEffect, useState } from 'react';

export function useIntersectionObserver(options = { threshold: [0] }) {
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    isIntersecting: false,
  });
  const [ref, setRef] = useState(null);

  useEffect(() => {
    let observer;
    if (ref) {
      observer = new IntersectionObserver(([entry]) => {
        setPosition({
          x: entry.boundingClientRect.x,
          y: entry.boundingClientRect.y,
          isIntersecting: entry.isIntersecting,
        });
      }, options);
      observer.observe(ref);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [ref, options]);

  return [position, setRef];
}
