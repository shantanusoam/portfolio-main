'use Client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Zoom from '../Animation/framerAnimation/Zoom';
import Image from 'next/image';
import { debounce } from 'lodash';
import { useHover } from '@/hooks/useHover';

const ToolTip = ({ children, data }) => {
  const [hoverRef, isHovered] = useHover();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const updateTooltipPosition = useMemo(
    () =>
      debounce((e) => {
        setTooltipPosition({ x: e.pageX, y: e.pageY });
      }, 5),
    []
  );
  var tooltipStyles = {};
  if (tooltipRef.current) {
    const rect = tooltipRef.current.getBoundingClientRect();
    const distanceFromLeft = rect.left + window.scrollX; // Distance from the left in pixels including scroll offset

    console.log('width of the' + distanceFromLeft);
    tooltipStyles = {
      className:
        ' text-white p-2 rounded-md absolute left-0 pointer-events-none z-30',
      inlineStyles: {
        left: tooltipPosition.x - distanceFromLeft, // Adjust offset from the left

        willChange: 'transform, opacity',
      },
    };
  }

  console.log(tooltipPosition.x, tooltipPosition.y);
  return (
    <div
      className="relative  mx-auto"
      ref={hoverRef}
      onMouseMove={updateTooltipPosition}
    >
      <div>
        <div ref={tooltipRef}>{children}</div>

        {
          true && (
            // <Slide isActive={isHovered} direction={-1} xdistance={60}>
            <div className="absolute left-0">
              <Zoom isActive={isHovered} ExternalStyles={tooltipStyles}>
                <div className="absolute z-30">
                  <div
                    className={`bg-white w-96 
                     m-2 p-4 drop-shadow-md`}
                  >
                    {/* <Image src={data.image} /> */}
                    <div className="">
                      <div className="text-lg text-black bg-blue-600">
                        {data}
                      </div>
                    </div>
                  </div>
                </div>
              </Zoom>
            </div>
          )

          // </Slide>
        }
      </div>
    </div>
  );
};

export default ToolTip;
