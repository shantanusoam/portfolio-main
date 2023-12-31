import { cn } from "@/lib/utils";
import { MotionValue, motion, useSpring, useTransform } from "framer-motion";

interface AlternateSlidingTextsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  scrollYProgress: MotionValue<number>;
  textsData: string[][];
  className?: string;
}

export default function AlternateSlidingTexts({
  scrollYProgress,
  textsData,
  className,
  ...props
}: AlternateSlidingTextsProps) {
  const forwardText = useTransform(
    useSpring(scrollYProgress, {
      stiffness: 100,
      damping: 25,
      restDelta: 0.001,
    }),
    [0.15, 1],
    ["0%", "100%"]
  );
  const reverseText = useTransform(
    useSpring(scrollYProgress, {
      stiffness: 100,
      damping: 25,
      restDelta: 0.001,
    }),
    [0.15, 1],
    ["0%", "-100%"]
  );

  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-3 justify-center font-extralight text-5xl my-3 text-white overflow-clip uppercase tracking-wider",
        className
      )}
    >
      {textsData.map((texts, i) => (
        <motion.div
          style={{ x: i % 2 == 0 ? reverseText : forwardText }}
          className="flex flex-row gap-2 text-gray items-center w-max relative"
          key={i}
        >
          {texts.map((text, j) => (
            <div
              className="flex flex-row items-center justify-center gap-2"
              key={j}
            >
              <p className="hover:text-primary hover:scale-105 transition duration-100 ease-in-out">
                {text}
              </p>
              <p className="text-lg font-extralight">•</p>
            </div>
          ))}
          <div
            className={cn(
              "absolute flex flex-row gap-2 items-center",
              i % 2 == 0
                ? "right-[calc(-100%-1rem)]"
                : "left-[calc(-100%-0.5rem)]"
            )}
          >
            {texts.map((text, k) => (
              <div
                className="flex flex-row items-center justify-center gap-2"
                key={k}
              >
                <p className="hover:text-primary hover:scale-105 transition duration-100 ease-in-out">
                  {text}
                </p>
                <p className="text-lg font-extralight">•</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
