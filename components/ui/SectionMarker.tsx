import { cn } from "@/lib/utils";

interface SectionMarkerProps {
  index: string;
  label: string;
  hint?: string;
  className?: string;
}

/**
 * Thin illuminated section divider — orange serial + label + optional hint.
 * Gives transitions between sections without empty black space.
 */
export default function SectionMarker({
  index,
  label,
  hint = "SCROLL TO INSPECT",
  className,
}: SectionMarkerProps) {
  return (
    <div
      className={cn("section-marker", className)}
      aria-hidden="true"
    >
      <span className="section-marker__index">{index}</span>
      <span className="section-marker__label">{label}</span>
      <span className="section-marker__hint">{hint}</span>
    </div>
  );
}
