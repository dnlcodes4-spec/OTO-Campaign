import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("@/content/home", () => ({
  getHomeContent: async () => ({
    headline: "Send someone who actually shows up.",
    intro:
      "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
    portrait: { src: "/images/oto-native.png", alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" },
  }),
}));

vi.mock("@/content/site", async () => {
  const actual = await vi.importActual<typeof import("@/content/site")>("@/content/site");
  return {
    ...actual,
    getSiteContentData: async () => actual.siteContentDefault,
  };
});

vi.mock("@/content/senator-job", async () => {
  const actual = await vi.importActual<typeof import("@/content/senator-job")>("@/content/senator-job");
  return {
    ...actual,
    getSenatorJobContent: async () => actual.senatorJobContentDefault,
  };
});

vi.mock("@/content/about", async () => {
  const actual = await vi.importActual<typeof import("@/content/about")>("@/content/about");
  return {
    ...actual,
    getAboutContent: async () => actual.aboutContentDefault,
  };
});

/*
 * getWatchContent is mocked through a controllable vi.fn() (reset to
 * resolve watchContentDefault in beforeEach below) rather than a fixed
 * async function, so a single test below can make it resolve a *poisoned*
 * merged result — video overridden away from watchContentDefault.video, the
 * shape a stray DB write could actually produce — and assert page.tsx does
 * not let that value reach the rendered film plane.
 */
const getWatchContentMock = vi.fn();
vi.mock("@/content/watch", async () => {
  const actual = await vi.importActual<typeof import("@/content/watch")>("@/content/watch");
  return {
    ...actual,
    getWatchContent: () => getWatchContentMock(),
  };
});

vi.mock("@/content/get-involved", async () => {
  const actual = await vi.importActual<typeof import("@/content/get-involved")>("@/content/get-involved");
  return {
    ...actual,
    getGetInvolvedContent: async () => actual.getInvolvedContentDefault,
  };
});

import HomePage from "./page";
import { aboutContentDefault } from "@/content/about";
import { getInvolvedContentDefault } from "@/content/get-involved";
import { siteContentDefault } from "@/content/site";
import { senatorJobContentDefault } from "@/content/senator-job";
import { watchContentDefault } from "@/content/watch";

// Same values as the `@/content/home` mock above (kept separate to avoid
// referencing an outer variable inside the hoisted vi.mock factory).
const homeContent = {
  headline: "Send someone who actually shows up.",
  intro:
    "Many Nigerians have yearned, thirsted and hungered for a change, but after all is said and done, they join the bandwagon and vote for the same. That was exactly what went wrong about eight years ago. This time, ask the questions first: why should we send you to Abuja, what do you have in mind for us, what pedigree do you have.",
  portrait: { src: "/images/oto-native.png", alt: "OTO, Oluwasegun Theophilus Oladimeji, in gold agbada and fila" },
};

function getSection(container: HTMLElement, id: string) {
  const section = container.querySelector(`#${id}`);
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

beforeEach(() => {
  getWatchContentMock.mockReset();
  getWatchContentMock.mockResolvedValue(watchContentDefault);
});

describe("Home page", () => {
  test("renders the poster headline", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Send someone who actually shows up." })
    ).toBeInTheDocument();
  });

  test("carries the four one-page sections by id", async () => {
    const { container } = render(await HomePage());
    getSection(container, "about");
    getSection(container, "agenda");
    getSection(container, "watch");
    getSection(container, "get-involved");
  });

  test("about answers the pedigree question", async () => {
    const { container } = render(await HomePage());
    const about = getSection(container, "about");
    expect(
      within(about).getAllByText(/Federal University of Technology, Minna/).length
    ).toBeGreaterThan(0);
    expect(
      within(about).getAllByText(/University of Portsmouth/).length
    ).toBeGreaterThan(0);
    expect(
      within(about).getByText(/He has businesses across states/)
    ).toBeInTheDocument();
    expect(within(about).getByText("Cranfield University")).toBeInTheDocument();
  });

  test("about features the Atunluto structure inside its plane", async () => {
    const { container } = render(await HomePage());
    const about = getSection(container, "about");
    expect(
      within(about).getByText(/Atunluto caucus within the Zenith Labour Party/)
    ).toBeInTheDocument();
    expect(
      within(about).getByRole("link", { name: /atunluto\.com/ })
    ).toHaveAttribute("href", "https://www.atunluto.com");
  });

  test("agenda carries the six legislative items", async () => {
    const { container } = render(await HomePage());
    const agenda = getSection(container, "agenda");
    expect(
      within(agenda).getByRole("heading", { name: "State police" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Residency over state of origin" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Redraft the Civil Defence law" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", { name: "Warranty laws with teeth" })
    ).toBeInTheDocument();
    expect(
      within(agenda).getByRole("heading", {
        name: "Institutions that answer to the constitution",
      })
    ).toBeInTheDocument();
  });

  test("composes the three candidate portraits with their content-file alt text", async () => {
    render(await HomePage());
    // 3 candidate portraits + 2 party badges + 1 featured-video facade poster.
    expect(screen.getAllByRole("img")).toHaveLength(6);
    expect(screen.getByAltText(homeContent.portrait.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-native.png")
    );
    expect(screen.getByAltText(aboutContentDefault.portrait.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-2.png")
    );
    expect(screen.getByAltText(getInvolvedContentDefault.image.alt)).toHaveAttribute(
      "src",
      expect.stringContaining("oto-suit-1.png")
    );
  });

  test("features the party badge in the hero and on the vote-targets plane", async () => {
    render(await HomePage());
    const badges = screen.getAllByAltText(siteContentDefault.partyLogo.alt);
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(badge).toHaveAttribute("src", expect.stringContaining("zlp-logo.png"));
    }
    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
    const targets = screen.getByText("1,000,000").closest("section");
    expect(targets?.querySelector('img[src*="zlp-logo"]')).not.toBeNull();
  });

  test("lays out the senator-job segments from the fetched content", async () => {
    render(await HomePage());
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "So what does a senator actually do all day?",
      })
    ).toBeInTheDocument();
    for (const segment of senatorJobContentDefault.segments) {
      expect(
        screen.getByRole("heading", { level: 3, name: segment.title })
      ).toBeInTheDocument();
    }
    expect(screen.getByText(senatorJobContentDefault.challenge)).toBeInTheDocument();
  });

  test("the film plane features the current clip as a facade, no embed until pressed", async () => {
    const { container } = render(await HomePage());
    const watch = getSection(container, "watch");
    expect(
      within(watch).getByRole("heading", {
        level: 2,
        name: "Why should you believe a word of this?",
      })
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(within(watch).getByRole("button", { name: `Play the film: ${watchContentDefault.title}` })).toBeInTheDocument();
  });

  test("the video prop stays sourced from watchContentDefault even if a poisoned/merged CMS row returns a different video", async () => {
    /*
     * Simulates the real failure mode: video is deliberately absent from
     * watchSchema so SchemaForm never renders a control for it, but
     * SchemaForm's save path spreads the *entire* loaded record forward on
     * every edit (Task 2's setKey design), so saving any other Watch field
     * from /admin/content/watch could persist a stray `video` key into the
     * oto_site_content row. From then on getWatchContent()'s merged result
     * would carry that DB value instead of the code default. This test
     * stands in for that poisoned row without touching the DB: it makes
     * getWatchContent() resolve a merged object whose `video` differs from
     * watchContentDefault.video, then asserts the *rendered* film plane
     * still reflects the hardcoded default, not the merged value.
     */
    const expectedVideo = watchContentDefault.video;
    if (!expectedVideo || expectedVideo.type !== "direct") {
      throw new Error(
        "This test assumes watchContentDefault.video is currently a 'direct' Cloudinary clip; update its assertions if that default ever changes."
      );
    }

    getWatchContentMock.mockResolvedValue({
      ...watchContentDefault,
      video: { type: "youtube", videoId: "poisoned-video-id-should-never-render" },
    });

    const { container } = render(await HomePage());
    const watch = getSection(container, "watch");

    // The poisoned YouTube facade must never reach the DOM...
    expect(container.querySelector('img[src*="i.ytimg.com"]')).toBeNull();
    expect(
      container.querySelector('img[src*="poisoned-video-id-should-never-render"]')
    ).toBeNull();

    // ...only the real, hardcoded default clip should render.
    const poster = within(watch).getByAltText(watchContentDefault.title);
    expect(poster).toHaveAttribute("src", expectedVideo.poster);
  });

  test("get involved carries the asks and the single vote target", async () => {
    const { container } = render(await HomePage());
    const getInvolved = getSection(container, "get-involved");
    expect(within(getInvolved).getByText(/at least ten more/)).toBeInTheDocument();
    expect(within(getInvolved).getByText(/the 2027 election/)).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.queryByText("500,000")).not.toBeInTheDocument();
    expect(
      screen.getByText(/from this target there is enough to win it/)
    ).toBeInTheDocument();
  });
});
