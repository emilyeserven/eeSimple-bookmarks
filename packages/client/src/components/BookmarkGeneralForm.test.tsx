import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BookmarkGeneralForm } from "./BookmarkGeneralForm";
import { renderWithRouter } from "../test-utils/router";
import { sampleBookmark, sampleCategories } from "../test-utils/story-mocks";

// BookmarkGeneralForm composes several already-extracted hooks (data, url-processing, scan
// handlers). These tests mock those boundaries so they can pin the form's OWN behavior — that the
// core fields seed from the bookmark and that Save submits the edited values — which the
// decomposition into a state hook + field-group components must preserve.

const updateMutateAsync = vi.fn<(args: unknown) => Promise<unknown>>();
const resolveSubmitUrl = vi.fn((url: string) => ({
  finalUrl: url,
  originalUrl: null,
}));

const idleMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
};

vi.mock("./useBookmarkFormData", () => ({
  useBookmarkFormData: () => ({
    actions: {
      updateBookmark: {
        mutateAsync: updateMutateAsync,
        isError: false,
        error: null,
      },
      fetchTitle: idleMutation,
      fetchMetadata: idleMutation,
      websiteLookup: {
        ...idleMutation,
        data: undefined,
      },
      urlDuplicateCheck: idleMutation,
    },
    websites: [],
    shortenerIgnoreList: [],
    redirectIgnoreList: [],
    tagTree: [],
    categories: sampleCategories,
    autofillRules: [],
    autoFetchTitle: false,
  }),
}));

vi.mock("./useBookmarkUrlProcessing", () => ({
  useBookmarkUrlProcessing: () => ({
    urlShortener: null,
    urlCleanup: null,
    showUrlCleanup: false,
    setShowUrlCleanup: vi.fn(),
    urlCleanupMode: "off",
    setUrlCleanupMode: vi.fn(),
    cleanupId: null,
    isUrlFetchable: () => false,
    runUrlCleanup: vi.fn(),
    undoUrlCleanup: vi.fn(),
    classifyUrlShortener: vi.fn(),
    resolveSubmitUrl,
  }),
}));

vi.mock("./useBookmarkScanHandlers", () => ({
  useBookmarkScanHandlers: () => ({
    runFetchTitle: vi.fn(),
    runFetchDescription: vi.fn(),
    runYouTubeEnrichment: vi.fn(),
    runUrlCleanup: vi.fn(),
    undoUrlCleanup: vi.fn(),
    undoTitleFetch: vi.fn(),
    runWebsiteLookup: vi.fn(),
  }),
}));

vi.mock("../lib/notifications", () => ({
  notifySuccess: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("bookmarkGeneralForm", () => {
  it("seeds the core fields from the bookmark", async () => {
    await renderWithRouter(<BookmarkGeneralForm bookmark={sampleBookmark} />);

    expect(screen.getByLabelText("URL")).toHaveValue("https://github.com");
    expect(screen.getByLabelText("Name")).toHaveValue("GitHub");
    expect(screen.getByLabelText("Description")).toHaveValue("Where the code lives.");
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("submits the edited values through updateBookmark", async () => {
    updateMutateAsync.mockResolvedValue(undefined);
    await renderWithRouter(<BookmarkGeneralForm bookmark={sampleBookmark} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "GitHub renamed",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Save changes",
    }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync.mock.calls[0][0]).toMatchObject({
      id: sampleBookmark.id,
      input: {
        title: "GitHub renamed",
        url: "https://github.com",
      },
    });
    expect(resolveSubmitUrl).toHaveBeenCalledWith("https://github.com", false);
  });

  it("includes people and group in the update payload (editable post-create)", async () => {
    updateMutateAsync.mockResolvedValue(undefined);
    await renderWithRouter(<BookmarkGeneralForm bookmark={sampleBookmark} />);

    fireEvent.click(screen.getByRole("button", {
      name: "Save changes",
    }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    const {
      input,
    } = updateMutateAsync.mock.calls[0][0] as { input: Record<string, unknown> };
    expect(input).toHaveProperty("personIds");
    expect(input).toHaveProperty("groupId");
  });
});
