import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "@/components/primitives/Section";
import { Heading } from "@/components/primitives/Heading";

export default function WorkWithUsLayout({ children }: { children: ReactNode }) {
  return (
    <Section>
      <Heading level={1}>
        Carry the message <span className="text-brand-red">yourself</span>
      </Heading>
      <p className="mt-4 max-w-xl font-body text-base text-ink/70">
        Five designs from the campaign, yours to use exactly as you like. Set one as your
        status, print copies for your own corner of Oyo South, and hand them out. If you can
        also{" "}
        <Link
          href="/#get-involved"
          className="font-medium text-brand-green underline decoration-2 underline-offset-4 hover:text-brand-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
        >
          put something behind the campaign
        </Link>
        , that counts too — every naira funds the message these posters carry.
      </p>
      <div className="mt-12">{children}</div>
    </Section>
  );
}
