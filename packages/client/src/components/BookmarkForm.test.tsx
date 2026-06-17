import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkForm } from "./BookmarkForm";

// The form pulls data from several query hooks and the UI store; stub them so the
// test can focus on the title-fetch behavior without a live API or QueryClient.
const mutateAsync = vi.fn<(url: string) => Promise<{ title: string }>>();
let autoFetchTitle = true;

vi.mock("../hooks/useBookmarks", () => ({
  useCreateBookmark: () => ({
    mutateAsync: vi.fn(),
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
}));
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
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
vi.mock("../stores/uiStore", () => ({
  useUiStore: (selector: (state: { autoFetchTitle: boolean }) => unknown) =>
    selector({
      autoFetchTitle,
    }),
}));

describe("BookmarkForm title fetching", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
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
    expect(mutateAsync).toHaveBeenCalledWith("https://example.com");
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
});
