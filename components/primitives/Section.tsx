import type { ReactNode } from "react";
import { Container } from "./Container";

type SectionTone = "surface" | "green" | "ink";

type SectionProps = {
  children: ReactNode;
  className?: string;
  tone?: SectionTone;
  id?: string;
};

const TONE_BG: Record<SectionTone, string> = {
  surface: "bg-surface text-ink",
  green: "bg-brand-green text-ink-inverse",
  ink: "bg-brand-green-deep text-ink-inverse",
};

export function Section({ children, className = "", tone = "surface", id }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-16 py-16 sm:py-20 lg:py-28 ${TONE_BG[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
