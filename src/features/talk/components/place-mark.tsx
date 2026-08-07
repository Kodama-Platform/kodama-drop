import { cn } from "@/lib/utils";
import type { PlaceMarkSpec } from "@/features/talk/types";

/** Abstract place identity mark — gradient + initials, never a stock photo. */
export function PlaceMark({
  mark,
  size = 44,
  className,
}: {
  mark: PlaceMarkSpec;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("talk-mark", className)}
      data-testid="place-mark"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        backgroundImage: `linear-gradient(135deg, ${mark.gradient[0]}, ${mark.gradient[1]})`,
      }}
    >
      {mark.coverUrl ? (
        <img
          src={mark.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="relative">{mark.initials}</span>
      )}
    </span>
  );
}
