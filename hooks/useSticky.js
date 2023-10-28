import { useState, useEffect, useRef } from "react";

export const useSticky = (offset = 0) => {
    const [isSticky, setSticky] = useState(false);
    const ref = useRef(null);
  
    const handleScroll = () => {
      if (ref.current) {
        setSticky(ref.current.getBoundingClientRect().top <= offset);
      }
    };
  
    useEffect(() => {
      window.addEventListener('scroll', handleScroll);
  
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, []);
  
    return { ref, isSticky };
  };