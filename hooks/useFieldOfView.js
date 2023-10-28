import React, { useEffect, useState } from 'react';

const useFieldOfView = (targetId) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1, // Percentage of the target element visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === targetId) {
          setIsInView(entry.isIntersecting);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      observer.observe(targetElement);
    }

    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
    };
  }, [targetId]);

  return isInView;
};

export default useFieldOfView;
