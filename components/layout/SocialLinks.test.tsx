import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialLinks } from "./SocialLinks";
import type { SocialLink } from "@/content/site";

const VALID: SocialLink = { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/" };

describe("SocialLinks", () => {
  test("renders a well-formed social link", () => {
    render(<SocialLinks plane="light" socials={[VALID]} />);
    expect(screen.getByRole("link", { name: "OTO on Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/"
    );
  });

  /*
   * Defense in depth for content/site.ts's getSiteContentData() filtering:
   * a malformed entry (e.g. one added via the admin CMS's generic list
   * "Add" button, which has no `platform` key) must not crash the page.
   * This guards against any future call path that bypasses
   * getSiteContentData() and hands SocialLinks an unfiltered array.
   */
  test("skips an entry with no recognized platform instead of throwing", () => {
    const malformed = { label: "x", href: "y" } as unknown as SocialLink;
    expect(() => render(<SocialLinks plane="light" socials={[VALID, malformed]} />)).not.toThrow();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "OTO on Facebook" })).toBeInTheDocument();
  });
});
