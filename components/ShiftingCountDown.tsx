'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import ToolTip from '@/components/ToolTip';

// NOTE: Change this date to whatever date you want to countdown to :)
const COUNTDOWN_FROM = '04/01/2021';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const ShiftingCountdown = ({ data }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [remaining, setRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    intervalRef.current = setInterval(handleCountdown, 1000);

    return () => clearInterval(intervalRef.current || undefined);
  }, []);

  const handleCountdown = () => {
    const Start = new Date(COUNTDOWN_FROM);

    const now = new Date();

    const distance = +now - +Start;

    const days = Math.floor(distance / DAY);
    const hours = Math.floor((distance % DAY) / HOUR);
    const minutes = Math.floor((distance % HOUR) / MINUTE);
    const seconds = Math.floor((distance % MINUTE) / SECOND);

    setRemaining({
      days,
      hours,
      minutes,
      seconds,
    });
  };

  return (
    <ToolTip data={`yohoooo ${data}+ years`}>
      <div className=" text-white mx-auto flex w-fit max-w-5xl flex-wrap items-center justify-center gap-x-4 text-xs md:text-sm">
        <CountdownItem num={remaining.days} text="days" />
        <CountdownItem num={remaining.hours} text="hours" />
        <CountdownItem num={remaining.minutes} text="minutes" />
        <CountdownItem num={remaining.seconds} text="seconds" />
      </div>
    </ToolTip>
  );
};

const CountdownItem = ({ num, text }: { num: number; text: string }) => {
  return (
    <div className="font-mono flex w-fit items-center justify-center gap-1.5 py-2">
      <div className="relative w-full overflow-hidden text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={num}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ ease: 'backIn', duration: 0.95 }}
            className="block font-mono text-sm font-semibold md:text-base"
          >
            {num}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs md:text-sm lg:text-base font-bold">{text}</span>
    </div>
  );
};

export default ShiftingCountdown;
