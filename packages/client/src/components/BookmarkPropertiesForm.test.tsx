import type { Bookmark, CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BookmarkPropertiesForm } from "./BookmarkPropertiesForm";
import { renderWithRouter } from "../test-utils/router";
import { sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

// The form seeds its number/boolean/datetime inputs from the bookmark and persists the values
// scoped to the bookmark's category on Save. These tests pin that — plus the empty state and the
// YouTube runtime/date-posted block — before the seeding state is shared with the prefill hook and
// the metadata fields are lifted into their own component.

const updateMutateAsync = vi.fn<(args: unknown) => Promise<unknown>>();
let customPropertiesData: CustomProperty[] = [];

vi.mock("../hooks/useBookmarks", () => ({
  useUpdateBookmark: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));
vi.mock("../hooks/useFetchMetadata", () => ({
  useFetchMetadata: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: customPropertiesData,
  }),
}));
vi.mock("../lib/notifications", () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  customPropertiesData = [];
});

describe("bookmarkPropertiesForm", () => {
  it("shows the empty state when no property applies to the bookmark", async () => {
    customPropertiesData = [];
    await renderWithRouter(<BookmarkPropertiesForm bookmark={sampleBookmark} />);

    expect(
      screen.getByText(/No custom properties are assigned/i),
    ).toBeInTheDocument();
  });

  it("renders the applicable properties and submits the seeded values", async () => {
    customPropertiesData = sampleProperties;
    updateMutateAsync.mockResolvedValue(undefined);
    await renderWithRouter(<BookmarkPropertiesForm bookmark={sampleBookmark} />);

    // Priority is a number property scoped to the bookmark's category.
    expect(screen.getByText("Priority")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Save changes",
    }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    const arg = updateMutateAsync.mock.calls[0][0] as {
      id: string;
      input: { numberValues: { propertyId: string;
        value: number; }[]; };
    };
    expect(arg.id).toBe(sampleBookmark.id);
    // The Priority value (8) seeded from the bookmark must survive the round-trip.
    expect(arg.input.numberValues).toEqual(
      expect.arrayContaining([
        {
          propertyId: "prop-priority",
          value: 8,
        },
      ]),
    );
  });

  it("renders the YouTube runtime and date-posted fields for a YouTube bookmark", async () => {
    const runtime = {
      ...sampleProperties[0],
      id: "prop-runtime",
      name: "Runtime",
      slug: "runtime",
    } satisfies CustomProperty;
    const datePosted = {
      ...sampleProperties[0],
      id: "prop-date-posted",
      name: "Date Posted",
      slug: "date-posted",
      type: "datetime",
    } satisfies CustomProperty;
    customPropertiesData = [runtime, datePosted];
    const youtubeBookmark: Bookmark = {
      ...sampleBookmark,
      url: "https://www.youtube.com/watch?v=abc123",
    };

    await renderWithRouter(<BookmarkPropertiesForm bookmark={youtubeBookmark} />);

    expect(screen.getByText("Runtime (seconds)")).toBeInTheDocument();
    expect(screen.getByText("Date Posted")).toBeInTheDocument();
  });
});
