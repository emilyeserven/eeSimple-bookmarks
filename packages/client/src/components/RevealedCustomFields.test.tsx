import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealedCustomFields } from "./RevealedCustomFields";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { renderWithRouter } from "../test-utils/router";

describe("RevealedCustomFields", () => {
  it("renders nothing when no main property applies to the category", async () => {
    const {
      container,
    } = await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          categoryId: "cat-without-props",
        }}
      >
        {form => (
          <RevealedCustomFields
            form={form}
            {...makeRevealedProps()}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a category's main (showInForm) custom property", async () => {
    // sampleProperties includes "Reviewed" (boolean, showInForm, scoped to cat-content).
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          categoryId: "cat-content",
        }}
      >
        {form => (
          <RevealedCustomFields
            form={form}
            {...makeRevealedProps()}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
  });
});
