import type { SourceDefaults } from "./BookmarkAdvancedSection";

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BookmarkAdvancedDescriptionTagsField } from "./BookmarkAdvancedDescriptionTagsField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { renderWithRouter } from "../test-utils/router";

function makeSourceDefaults(overrides: Partial<SourceDefaults> = {}): SourceDefaults {
  return {
    label: null,
    showSourceDefault: false,
    showMediaTypeDefault: false,
    setCategory: false,
    setTags: false,
    setMediaType: false,
    onSetCategory: () => undefined,
    onSetTags: () => undefined,
    onSetMediaType: () => undefined,
    ...overrides,
  };
}

function renderField(opts: {
  url?: string;
  onFetchDescription?: (url: string) => void;
  isFetchDescriptionPending?: boolean;
}) {
  return renderWithRouter(
    <BookmarkFormHost
      initialValues={{
        url: opts.url ?? "",
      }}
    >
      {form => (
        <BookmarkAdvancedDescriptionTagsField
          form={form}
          tagTree={[]}
          onTagToggle={() => undefined}
          sourceDefaults={makeSourceDefaults()}
          onFetchDescription={opts.onFetchDescription}
          isFetchDescriptionPending={opts.isFetchDescriptionPending}
        />
      )}
    </BookmarkFormHost>,
  );
}

describe("BookmarkAdvancedDescriptionTagsField", () => {
  it("omits the fetch-description button when no fetch handler is provided", async () => {
    await renderField({
      url: "https://example.com",
    });
    expect(screen.queryByRole("button", {
      name: /fetch description from url/i,
    })).not.toBeInTheDocument();
  });

  it("disables the fetch-description button for a non-fetchable URL", async () => {
    await renderField({
      url: "",
      onFetchDescription: () => undefined,
    });
    expect(screen.getByRole("button", {
      name: /fetch description from url/i,
    })).toBeDisabled();
  });

  it("enables the fetch-description button for a fetchable URL", async () => {
    await renderField({
      url: "https://example.com",
      onFetchDescription: () => undefined,
    });
    expect(screen.getByRole("button", {
      name: /fetch description from url/i,
    })).toBeEnabled();
  });

  it("disables the fetch-description button while a fetch is pending", async () => {
    await renderField({
      url: "https://example.com",
      onFetchDescription: () => undefined,
      isFetchDescriptionPending: true,
    });
    expect(screen.getByRole("button", {
      name: /fetch description from url/i,
    })).toBeDisabled();
  });
});
