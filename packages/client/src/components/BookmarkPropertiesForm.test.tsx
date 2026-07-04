import type { Bookmark, CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BookmarkPropertiesForm } from "./BookmarkPropertiesForm";
import { renderWithRouter } from "../test-utils/router";
import { sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

// The form seeds its number/boolean/datetime inputs from the bookmark and debounce-auto-saves the
// values scoped to the bookmark's category (no Save button — the edit-tab standard). These tests pin
// that — plus the empty state and the YouTube runtime/date-posted block.

// The debounced auto-save calls `updateBookmark.mutate(vars, opts)`.
const updateMutate = vi.fn(
  (_vars: unknown, opts?: { onSuccess?: (data: unknown) => void }) => opts?.onSuccess?.(undefined),
);
let customPropertiesData: CustomProperty[] = [];

vi.mock("../hooks/useBookmarks", () => ({
  useUpdateBookmark: () => ({
    mutate: updateMutate,
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

  it("renders the applicable properties and auto-saves an edited value (no Save button)", async () => {
    customPropertiesData = sampleProperties;
    await renderWithRouter(<BookmarkPropertiesForm bookmark={sampleBookmark} />);

    // Priority is a number property scoped to the bookmark's category, seeded to 8.
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Save changes",
    })).toBeNull();

    // Editing a value debounce-persists the whole property set (no Save click).
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: {
        value: "9",
      },
    });

    // The 700ms debounce fires; wait it out on real timers.
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    const arg = updateMutate.mock.calls[0][0] as {
      id: string;
      input: { numberValues: { propertyId: string;
        value: number; }[]; };
    };
    expect(arg.id).toBe(sampleBookmark.id);
    expect(arg.input.numberValues).toEqual(
      expect.arrayContaining([
        {
          propertyId: "prop-priority",
          value: 9,
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
