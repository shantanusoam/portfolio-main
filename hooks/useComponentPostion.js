import { useRef, useEffect, useState } from 'react';

export function useComponentPosition(emitOnScroll = false) {
  const componentRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (componentRef.current) {
      const handleUpdatePosition = () => {
        const { top, left } = componentRef.current.getBoundingClientRect();
        setPosition({ x: left, y: top });
      };
      handleUpdatePosition();
      if (emitOnScroll) {
        window.addEventListener('scroll', handleUpdatePosition);
        return () => {
          window.removeEventListener('scroll', handleUpdatePosition);
        };
      }
    }
  }, [componentRef, emitOnScroll]);

  return [position, componentRef];
}
