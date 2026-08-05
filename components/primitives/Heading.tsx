import type { ElementType, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
  /*
   * When provided, replaces the level's default size/leading/tracking classes
   * entirely (the level still controls the semantic tag). This avoids stacking
   * conflicting same-property utilities, whose winner would otherwise depend on
   * Tailwind's emission order. Use className only for non-conflicting additions.
   */
  sizeOverride?: string;
};

const LEVEL_TAG: Record<HeadingLevel, ElementType> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

const LEVEL_STYLES: Record<HeadingLevel, string> = {
  1: "text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight",
  2: "text-3xl sm:text-4xl lg:text-5xl leading-[1.02] tracking-tight",
  3: "text-2xl sm:text-3xl leading-tight",
  4: "text-xl sm:text-2xl leading-tight",
};

export function Heading({ level, children, className = "", sizeOverride }: HeadingProps) {
  const Tag = LEVEL_TAG[level];
  const sizeClasses = sizeOverride ?? LEVEL_STYLES[level];
  return (
    <Tag className={`font-display font-semibold ${sizeClasses} ${className}`}>
      {children}
    </Tag>
  );
}
