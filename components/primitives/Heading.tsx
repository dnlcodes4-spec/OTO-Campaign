import type { ElementType, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
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

export function Heading({ level, children, className = "" }: HeadingProps) {
  const Tag = LEVEL_TAG[level];
  return (
    <Tag className={`font-display font-semibold ${LEVEL_STYLES[level]} ${className}`}>
      {children}
    </Tag>
  );
}
