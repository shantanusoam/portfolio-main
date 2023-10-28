import { useState, useEffect, useRef } from 'react';

export function useIsComponentInView(id, options = {}, onInViewChange) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const newIsInView = entry.isIntersecting;
        setIsInView(newIsInView);
        onInViewChange && onInViewChange(newIsInView);
      },
      {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0,
      }
    );

    const element = document.getElementById(id);
    if (element) {
      observer.observe(element);
      ref.current = element;
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [id, options.rootMargin, options.threshold, onInViewChange]);

  return isInView;
}