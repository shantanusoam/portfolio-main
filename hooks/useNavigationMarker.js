import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

export const useNavigationMarker = () => {
  const [markerPos, setMarkerPos] = useState({
    x: 0,
    width: 0,
  });

  const onSelect = useCallback(({ ref }) => {
    if (!ref.current) return;
    const x = ref.current.offsetLeft;
    const { width } = ref.current.getBoundingClientRect();
    setMarkerPos({
      width,
      x,
    });
  }, []);

  return {
    markerPos,
    onSelect,
  };
};

export const NavigationMarker = styled.div`
  position: absolute;
  /* 1px border negative margin */
  bottom: -1px;
  left: ${({ x }) => x || 0}px;
  height: 4px;
  width: ${({ width }) => width || 0}px;
  background: #f7e700;
  transition: all ease 0.3s;
`;
