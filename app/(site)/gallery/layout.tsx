import type { ReactNode } from "react";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <Section>
      <Heading level={1}>The campaign in pictures</Heading>
      <p className="mt-4 max-w-xl font-body text-base text-ink/70">
        Photos and video from the trail across the Oyo South Senatorial District.
      </p>
      <div className="mt-12">{children}</div>
    </Section>
  );
}
