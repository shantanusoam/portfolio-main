import { useEffect, useState } from 'react';

const useInView = (id) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById(id);
      if (element) {
        const { top, bottom } = element.getBoundingClientRect();
        setIsInView(top < window.innerHeight && bottom >= 0);
      }
    };

    handleScroll(); // Check initial state

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [id]);

  return isInView;
};

export default useInView;
