import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { CampaignImage } from "./CampaignImage";

describe("CampaignImage", () => {
  test("renders an image with its alt text when src is given", () => {
    render(
      <CampaignImage src="/candidate.jpg" alt="Portrait of OTO" className="aspect-[4/5]" />
    );
    expect(screen.getByAltText("Portrait of OTO")).toBeInTheDocument();
  });

  test("passes the responsive sizes through to the image", () => {
    render(
      <CampaignImage
        src="/candidate.jpg"
        alt="Portrait of OTO"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    );
    expect(screen.getByAltText("Portrait of OTO")).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 40vw, 100vw"
    );
  });

  test("keeps the photo alpha-safe: no brand plane painted behind a real src", () => {
    const { container } = render(
      <CampaignImage src="/candidate.jpg" alt="Portrait of OTO" tone="green-deep" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toMatch(/bg-brand/);
  });

  test("cutout fit anchors the full figure to the bottom edge instead of cropping", () => {
    render(<CampaignImage src="/candidate.jpg" alt="Portrait of OTO" fit="cutout" />);
    const image = screen.getByAltText("Portrait of OTO");
    expect(image.classList.contains("object-contain")).toBe(true);
    expect(image.classList.contains("object-bottom")).toBe(true);
    expect(image.classList.contains("object-cover")).toBe(false);
  });

  test("default fit stays cover for framed photography", () => {
    render(<CampaignImage src="/candidate.jpg" alt="Portrait of OTO" />);
    expect(screen.getByAltText("Portrait of OTO").classList.contains("object-cover")).toBe(
      true
    );
  });

  test("renders a flat brand plane, not an image, when src is absent", () => {
    const { container } = render(
      <CampaignImage alt="Portrait of OTO" tone="green-deep" className="aspect-[4/5]" />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const plane = container.firstElementChild as HTMLElement;
    expect(plane.getAttribute("aria-hidden")).toBe("true");
    expect(plane.classList.contains("bg-brand-green-deep")).toBe(true);
    expect(plane.classList.contains("aspect-[4/5]")).toBe(true);
  });

  test("defaults the plane tone to campaign green", () => {
    const { container } = render(<CampaignImage alt="Portrait of OTO" />);
    const plane = container.firstElementChild as HTMLElement;
    expect(plane.classList.contains("bg-brand-green")).toBe(true);
  });
});
