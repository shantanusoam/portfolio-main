'use client';
import { progress } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import styles from './string.module.css';
import useSound from 'use-sound';
import { debounce } from 'lodash';
import rubberString from '@/public/rubberstring3.mp3';
const String = ({ volume, playbackRate }) => {
  const [playSound, setPlaySound] = useState(false);
  const [play, { stop }] = useSound(rubberString, {
    playbackRate,
    volume: volume,
    soundEnabled: playSound,
  });

  const path = useRef(null);
  let progress = 0;
  let x = 0.5;
  let time = Math.PI / 2;
  let reqId = null;

  useEffect(() => {
    setPath(progress);
  }, []);

  const setPath = (progress: number) => {
    const width = window.innerWidth * 0.7;

    path.current.setAttributeNS(
      null,
      'd',
      `M 0 50 Q ${width * x} ${50 + progress} ${width} 50`
    );
  };

  const lerp = (x, y, a) => x * (1 - a) + y * a;

  const manageMouseEnter = () => {
    if (reqId) {
      cancelAnimationFrame(reqId);
      resetAnimation();
    }
  };

  const manageMouseMove = (e) => {
    const { movementY, clientX } = e;
    const pathBound = path.current.getBoundingClientRect();
    x = (clientX - pathBound.left) / pathBound.width;
    progress += movementY;
    setPath(progress);
  };

  const manageMouseLeave = () => {
    animateOut();
  };

  const animateOut = () => {
    const newProgress = progress * Math.sin(time);

    progress = lerp(progress, 0, 0.025);
    time += 0.2;
    setPath(newProgress);
    if (Math.abs(progress) > 0.75) {
      reqId = requestAnimationFrame(animateOut);
    } else {
      resetAnimation();
    }
  };

  const resetAnimation = () => {
    time = Math.PI / 2;
    progress = 0;
  };

  return (
    <div className={styles.line}>
      <div
        onMouseEnter={() => {
          manageMouseEnter();

          stop();
        }}
        onMouseMove={(e) => {
          manageMouseMove(e);
        }}
        onMouseLeave={() => {
          manageMouseLeave();
          setPlaySound(true);
          play();
        }}
        className={styles.box}
      ></div>
      <svg>
        <path ref={path}></path>
      </svg>
    </div>
  );
};

export default String;
