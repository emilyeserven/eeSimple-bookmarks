import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealedUrlCleanupSection } from "./RevealedUrlCleanupSection";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { renderWithRouter } from "../test-utils/router";

describe("RevealedUrlCleanupSection", () => {
  it("renders nothing when showUrlCleanup is false", async () => {
    const {
      container,
    } = await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com/?utm_source=x",
        }}
      >
        {form => (
          <RevealedUrlCleanupSection
            form={form}
            {...makeRevealedProps({
              showUrlCleanup: false,
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("URL Cleanup")).not.toBeInTheDocument();
  });

  it("renders the cleanup panel when showUrlCleanup is true", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com/?utm_source=x",
        }}
      >
        {form => (
          <RevealedUrlCleanupSection
            form={form}
            {...makeRevealedProps({
              showUrlCleanup: true,
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByText("URL Cleanup")).toBeInTheDocument();
  });
});
