import type { Bookmark } from "@eesimple/types";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkForm } from "./BookmarkForm";

// The form pulls data from several query hooks and the UI store; stub them so the
// test can focus on the title-fetch behavior without a live API or QueryClient.
const mutateAsync = vi.fn<(url: string) => Promise<{ title: string }>>();
let autoFetchTitle = true;

const updateMutateAsync = vi.fn<(args: unknown) => Promise<unknown>>();

vi.mock("../hooks/useBookmarks", () => ({
  useCreateBookmark: () => ({
    mutateAsync: vi.fn(),
    isError: false,
    error: null,
  }),
  useUpdateBookmark: () => ({
    mutateAsync: updateMutateAsync,
    isError: false,
    error: null,
  }),
}));
vi.mock("../hooks/useCategories", () => ({
  useCategories: () => ({
    data: [],
  }),
  useCategoryRootTags: () => ({
    data: [],
  }),
  useCategoryDefaults: () => ({
    data: undefined,
  }),
}));
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useAutofill", () => ({
  useAutofillRules: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useTags", () => ({
  useTagTree: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useFetchTitle", () => ({
  useFetchTitle: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));
vi.mock("../hooks/useWebsites", () => ({
  useWebsiteLookup: () => ({
    data: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
}));
vi.mock("../stores/uiStore", () => ({
  useUiStore: (selector: (state: { autoFetchTitle: boolean }) => unknown) =>
    selector({
      autoFetchTitle,
    }),
}));

describe("BookmarkForm title fetching", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    updateMutateAsync.mockReset();
    autoFetchTitle = true;
  });

  it("fills the Name field when the fetch button is clicked", async () => {
    mutateAsync.mockResolvedValue({
      title: "Example Domain",
    });
    render(<BookmarkForm />);

    fireEvent.change(screen.getByLabelText("URL"), {
      target: {
        value: "https://example.com",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Fetch title from URL",
    }));

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Example Domain"));
    expect(mutateAsync).toHaveBeenCalledWith({
      url: "https://example.com",
      siteName: undefined,
    });
  });

  it("auto-fills an empty Name when the URL field is blurred", async () => {
    mutateAsync.mockResolvedValue({
      title: "Example Domain",
    });
    render(<BookmarkForm />);

    const urlInput = screen.getByLabelText("URL");
    fireEvent.change(urlInput, {
      target: {
        value: "https://example.com",
      },
    });
    fireEvent.blur(urlInput);

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Example Domain"));
  });

  it("does not overwrite a typed Name on URL blur", async () => {
    render(<BookmarkForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "My title",
      },
    });
    const urlInput = screen.getByLabelText("URL");
    fireEvent.change(urlInput, {
      target: {
        value: "https://example.com",
      },
    });
    fireEvent.blur(urlInput);

    await waitFor(() => expect(mutateAsync).not.toHaveBeenCalled());
    expect(screen.getByLabelText("Name")).toHaveValue("My title");
  });

  it("prefills fields and updates the bookmark when editing", async () => {
    updateMutateAsync.mockResolvedValue(undefined);
    const onDone = vi.fn();
    const bookmark: Bookmark = {
      id: "11111111-1111-1111-1111-111111111111",
      url: "https://github.com",
      originalUrl: null,
      title: "GitHub",
      description: "Code host",
      categoryId: "22222222-2222-2222-2222-222222222222",
      website: null,
      tags: [],
      numberValues: [],
      booleanValues: [],
      priority: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
    };

    render(
      <BookmarkForm
        bookmark={bookmark}
        onDone={onDone}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("GitHub");
    expect(screen.getByLabelText("URL")).toHaveValue("https://github.com");

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "GitHub Home",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Save changes",
    }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: bookmark.id,
        input: expect.objectContaining({
          title: "GitHub Home",
          url: "https://github.com",
        }),
      }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
