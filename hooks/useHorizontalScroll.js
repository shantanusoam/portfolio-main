import { useRef, useEffect, useState } from 'react';

const useHorizontalScroll = () => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState(undefined);
  const [current, setCurrent] = useState(undefined);

  useEffect(() => {
    const navbar = ref.current;

    const handleMouseDown = (event) => {
      setIsDragging(true);
      setStart(event.clientX);
      event.preventDefault();
    };

    const handleMouseMove = (event) => {
      if (isDragging) {
        setCurrent(event.clientX);
        navbar.scrollLeft -= current - start;
        setStart(current);
        event.preventDefault();
      }
    };

    const handleMouseUp = (event) => {
      setIsDragging(false);
      event.preventDefault();
    };

    const handleMouseLeave = (event) => {
      setIsDragging(false);
      event.preventDefault();
    };

    const handleTouchStart = (event) => {
      setIsDragging(true);
      setStart(event.touches[0].clientX);
      event.preventDefault();
    };

    const handleTouchMove = (event) => {
      if (isDragging) {
        setCurrent(event.touches[0].clientX);
        navbar.scrollLeft -= current - start;
        setStart(current);
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event) => {
      setIsDragging(false);
      event.preventDefault();
    };

    navbar.addEventListener('mousedown', handleMouseDown);
    navbar.addEventListener('mousemove', handleMouseMove);
    navbar.addEventListener('mouseup', handleMouseUp);
    navbar.addEventListener('mouseleave', handleMouseLeave);
    navbar.addEventListener('touchstart', handleTouchStart);
    navbar.addEventListener('touchmove', handleTouchMove);
    navbar.addEventListener('touchend', handleTouchEnd);

    return () => {
      navbar.removeEventListener('mousedown', handleMouseDown);
      navbar.removeEventListener('mousemove', handleMouseMove);
      navbar.removeEventListener('mouseup', handleMouseUp);
      navbar.removeEventListener('mouseleave', handleMouseLeave);
      navbar.removeEventListener('touchstart', handleTouchStart);
      navbar.removeEventListener('touchmove', handleTouchMove);
      navbar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, start, current, ref]);

  return ref;
};

export default useHorizontalScroll;
