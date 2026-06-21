import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealedWebsiteBanner } from "./RevealedWebsiteBanner";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps, makeWebsiteLookup } from "../test-utils/revealedFixtures";
import { renderWithRouter } from "../test-utils/router";

describe("RevealedWebsiteBanner", () => {
  it("marks an already-known website as an existing site", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
        }}
      >
        {() => (
          <RevealedWebsiteBanner
            {...makeRevealedProps({
              websiteLookup: makeWebsiteLookup({
                domain: "example.com",
                exists: true,
                siteName: "Example",
                mediaTypeId: null,
                shortener: null,
              }),
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByText("Existing site")).toBeInTheDocument();
  });

  it("offers a site-name input for a new website", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://new-site.com",
        }}
      >
        {() => (
          <RevealedWebsiteBanner
            {...makeRevealedProps({
              websiteSiteName: "New Site",
              websiteLookup: makeWebsiteLookup({
                domain: "new-site.com",
                exists: false,
                siteName: null,
                mediaTypeId: null,
                shortener: null,
              }),
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByText("New site")).toBeInTheDocument();
    expect(screen.getByText("Site name")).toBeInTheDocument();
  });
});
