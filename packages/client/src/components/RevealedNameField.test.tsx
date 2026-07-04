import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealedNameField } from "./RevealedNameField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { renderWithRouter } from "../test-utils/router";

describe("RevealedNameField", () => {
  it("disables the fetch-title button for a non-fetchable URL", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "",
        }}
      >
        {form => (
          <RevealedNameField
            form={form}
            {...makeRevealedProps()}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByRole("button", {
      name: /fetch title from url/i,
    })).toBeDisabled();
  });

  it("enables the fetch-title button for a fetchable URL", async () => {
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
        }}
      >
        {form => (
          <RevealedNameField
            form={form}
            {...makeRevealedProps()}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByRole("button", {
      name: /fetch title from url/i,
    })).toBeEnabled();
  });

  it("shows the undo line only when a title fetch has happened", async () => {
    const {
      unmount,
    } = await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
          title: "Example",
        }}
      >
        {form => (
          <RevealedNameField
            form={form}
            {...makeRevealedProps({
              titleFetch: null,
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.queryByRole("button", {
      name: /^undo$/i,
    })).not.toBeInTheDocument();
    unmount();

    // `rerender` would drop this test's `QueryClientProvider`/`RouterProvider` (it only replaces the
    // inner UI passed to the first `render`, not the wrapper `renderWithRouter` builds around it), so
    // a fresh `renderWithRouter` call is used here instead now that `RevealedNameField` renders a
    // query-hook-using names editor.
    await renderWithRouter(
      <BookmarkFormHost
        initialValues={{
          url: "https://example.com",
          title: "Example",
        }}
      >
        {form => (
          <RevealedNameField
            form={form}
            {...makeRevealedProps({
              titleFetch: {
                previous: "Old title",
              },
            })}
          />
        )}
      </BookmarkFormHost>,
    );
    expect(screen.getByRole("button", {
      name: /^undo$/i,
    })).toBeInTheDocument();
    expect(screen.getByText("Old title")).toBeInTheDocument();
  });
});
