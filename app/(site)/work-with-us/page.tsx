import type { Metadata } from "next";
import { posters } from "@/content/posters";
import { PosterGrid } from "@/components/sections/PosterGrid";

export const metadata: Metadata = {
  title: "Work With Us",
  description:
    "Download OTO for Senate campaign posters to use as your status, print locally, and share.",
};

export default function WorkWithUsPage() {
  return <PosterGrid posters={posters} />;
}
