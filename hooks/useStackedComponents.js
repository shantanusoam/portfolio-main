import React, { useState, useEffect } from 'react';

const useStackedComponents = (components) => {
  const [componentHeights, setComponentHeights] = useState([]);
  const [totalHeight, setTotalHeight] = useState(0);

  useEffect(() => {
    const heights = components.map((component) => {
      return component.current.getBoundingClientRect().height;
    });
    setComponentHeights(heights);
    setTotalHeight(heights.reduce((acc, curr) => acc + curr, 0));
  }, [components]);

  const styleForComponent = (index) => {
    if (index === 0) {
      return { position: 'sticky', top: 0 };
    }
    const previousHeights = componentHeights.slice(0, index);
    const top = previousHeights.reduce((acc, curr) => acc + curr, 0);
    return { position: 'absolute', top };
  };

  return { styleForComponent, totalHeight };
};

export default useStackedComponents;