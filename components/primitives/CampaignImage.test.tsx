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
