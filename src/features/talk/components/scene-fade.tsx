import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const OUT_MS = 170;
const IN_MS = 340;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A quiet crossfade between scenes keyed by `sceneKey`.
 * Dissolves the old content out, then unfolds the new content in — while
 * gently settling the container height so the surface never jumps.
 * Content within the same scene updates live (no transition).
 * Honors prefers-reduced-motion with an immediate, non-jarring swap.
 */
export function SceneFade({
  sceneKey,
  className,
  children,
}: {
  sceneKey: string;
  className?: string;
  children: ReactNode;
}) {
  const reduce = prefersReducedMotion();
  const [current, setCurrent] = useState<{ key: string; node: ReactNode }>({ key: sceneKey, node: children });
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [height, setHeight] = useState<number | "auto">("auto");
  const innerRef = useRef<HTMLDivElement>(null);

  // Same scene → keep content fresh without any motion.
  useEffect(() => {
    if (sceneKey === current.key) setCurrent({ key: sceneKey, node: children });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, sceneKey]);

  // Scene changed → dissolve old, swap, then unfold new.
  useEffect(() => {
    if (sceneKey === current.key) return;
    if (reduce) {
      setCurrent({ key: sceneKey, node: children });
      setHeight("auto");
      return;
    }
    setHeight(innerRef.current?.offsetHeight ?? "auto");
    setPhase("out");
    const t = setTimeout(() => {
      setCurrent({ key: sceneKey, node: children });
      setPhase("in");
    }, OUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey]);

  // After the new scene mounts, settle the height then release to auto.
  useLayoutEffect(() => {
    if (reduce || phase !== "in") return;
    setHeight((h) => (typeof h === "number" ? (innerRef.current?.offsetHeight ?? h) : "auto"));
    const t = setTimeout(() => setHeight("auto"), IN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.key, phase]);

  return (
    <div
      className={cn("talk-scene-wrap", typeof height === "number" && "talk-scene-wrap--clip", className)}
      style={typeof height === "number" ? { height } : undefined}
    >
      <div ref={innerRef} className={cn("talk-scene", phase === "out" ? "talk-scene--out" : "talk-scene--in")}>
        {current.node}
      </div>
    </div>
  );
}
