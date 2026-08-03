import { cn } from "@/lib/utils";

interface HardwareClipProps {
  className?: string;
  side?: "left" | "right";
}

/**
 * Tiny oxidized mounting clip — use sparingly on orange slab / glass panels.
 * Pure CSS so we don't wait on chrome hardware assets.
 */
export default function HardwareClip({
  className,
  side = "left",
}: HardwareClipProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "hardware-clip",
        side === "right" && "hardware-clip--right",
        className
      )}
    />
  );
}
