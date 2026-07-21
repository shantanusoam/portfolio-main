import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";

interface SlidingTextProps extends HTMLMotionProps<"div"> {
  children: string;
  className?: string;
  doNotRepeat?: boolean;
  amount?: number | "all" | "some";
  margin?: string;
  /** Per-letter stagger in seconds. Default 0.18 — ComboMeter passes ~0.05. */
  letterDelay?: number;
  /** Per-letter slide duration in seconds. Default 0.38. */
  letterDuration?: number;
}

export function SlidingText({
  children,
  className,
  doNotRepeat = true,
  amount = 0.8,
  margin = "0px 0px -200px 0px",
  letterDelay = 0.18,
  letterDuration = 0.38,
  ...props
}: SlidingTextProps) {
  const letters = children.split("");

  return (
    <motion.div
      {...props}
      className={cn(
        "text-6xl font-black flex relative overflow-hidden text-center",
        className
      )}
      variants={{
        down: {
          opacity: "0%",
        },
        up: {
          opacity: "100%",
          transition: {
            duration: 0.25,
          },
        },
      }}
      initial={"down"}
      whileInView={"up"}
      viewport={{ once: doNotRepeat, amount: amount, margin: margin }}
    >
      {letters.map((letter, i) => (
        <div key={i}>
          <motion.p
            custom={i}
            variants={{
              down: {
                y: "0%",
              },
              up: (i: number) => ({
                y: "-100%",
                transition: {
                  duration: letterDuration,
                  delay: letterDelay * i,
                  ease: "easeInOut",
                },
              }),
            }}
            className="m-[-0.025em] min-w-[0.8rem] absolute"
          >
            {letter}
          </motion.p>
          <motion.p
            custom={i}
            variants={{
              down: {
                y: "100%",
              },
              up: (i: number) => ({
                y: "0%",
                transition: {
                  duration: letterDuration,
                  delay: letterDelay * i,
                  ease: "easeInOut",
                },
              }),
            }}
            className="m-[-0.025em] min-w-[0.8rem]"
          >
            {letter}
          </motion.p>
        </div>
      ))}
    </motion.div>
  );
}
