import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealedAutofillOffer } from "./RevealedAutofillOffer";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps, makeWebsiteLookup } from "../test-utils/revealedFixtures";
import { renderWithRouter } from "../test-utils/router";

describe("RevealedAutofillOffer", () => {
  it("renders nothing for an existing website", async () => {
    const {
      container,
    } = await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
          categoryId: "cat-workflow",
        }}
      >
        {form => (
          <RevealedAutofillOffer
            form={form}
            {...makeRevealedProps({
              websiteLookup: makeWebsiteLookup({
                domain: "example.com",
                exists: true,
                siteName: "Example",
                shortener: null,
              }),
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no resolved domain", async () => {
    const {
      container,
    } = await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
          categoryId: "cat-workflow",
        }}
      >
        {form => (
          <RevealedAutofillOffer
            form={form}
            {...makeRevealedProps({
              websiteLookup: makeWebsiteLookup({
                domain: null,
                exists: false,
                siteName: null,
                shortener: null,
              }),
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers to create a rule for a new site that resolved to a domain", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://new-site.com",
          categoryId: "cat-workflow",
        }}
      >
        {form => (
          <RevealedAutofillOffer
            form={form}
            {...makeRevealedProps({
              websiteLookup: makeWebsiteLookup({
                domain: "new-site.com",
                exists: false,
                siteName: null,
                shortener: null,
              }),
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByRole("button", {
      name: /create rule/i,
    })).toBeInTheDocument();
  });
});
