import type { Bookmark, Website } from "@eesimple/types";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkForm } from "./BookmarkForm";

// The form pulls data from several query hooks and the UI store; stub them so the
// test can focus on the title-fetch behavior without a live API or QueryClient.
const mutateAsync = vi.fn<(url: string) => Promise<{ title: string }>>();
let autoFetchTitle = true;
let websiteLookupData:
  | { exists: boolean;
    domain: string | null;
    siteName: string | null; }
    | undefined;
let websitesData: Website[] = [];

const updateMutateAsync = vi.fn<(args: unknown) => Promise<unknown>>();

// A built-in YouTube website carrying the param rule that keeps only `v` on `/watch`.
function youtubeWebsite(): Website {
  return {
    id: "yt",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    shortenedLinks: [],
    paramRules: [
      {
        pathSuffix: "/watch",
        params: ["v"],
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

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
  useUploadBookmarkImage: () => ({
    mutateAsync: vi.fn(),
  }),
  useAutoBookmarkImage: () => ({
    mutateAsync: vi.fn(),
  }),
  useDeleteBookmarkImage: () => ({
    mutateAsync: vi.fn(),
  }),
}));
vi.mock("../hooks/useCategories", () => ({
  useCategories: () => ({
    data: [],
  }),
  useCreateCategory: () => ({
    mutate: vi.fn(),
    isError: false,
    error: null,
  }),
  useCategoryRootTags: () => ({
    data: [],
  }),
  useCategoryDefaults: () => ({
    data: undefined,
  }),
}));
vi.mock("../hooks/useCheckUrl", () => ({
  useCheckUrl: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
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
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));
vi.mock("../hooks/useFetchMetadata", () => ({
  useFetchMetadata: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      title: null,
      isYouTube: false,
      channel: null,
      durationSeconds: null,
      thumbnailUrl: null,
    }),
    isPending: false,
  }),
}));
vi.mock("../hooks/useMediaTypes", () => ({
  useMediaTypes: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useWebsites", () => ({
  useWebsiteLookup: () => ({
    data: websiteLookupData,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
  useWebsites: () => ({
    data: websitesData,
  }),
}));
vi.mock("../hooks/useAppSettings", () => ({
  useShortenerIgnoreList: () => ({
    data: [],
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
    websiteLookupData = undefined;
    websitesData = [];
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
      image: null,
      categoryId: "22222222-2222-2222-2222-222222222222",
      website: null,
      mediaType: null,
      youtubeChannel: null,
      tags: [],
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [],
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

  it("re-fetches the Name with the edited site name when Site name is blurred", async () => {
    websiteLookupData = {
      exists: false,
      domain: "allrecipes.com",
      siteName: null,
    };
    mutateAsync.mockResolvedValue({
      title: "Best Pancakes",
    });
    render(<BookmarkForm />);

    fireEvent.change(screen.getByLabelText("URL"), {
      target: {
        value: "https://allrecipes.com/recipe/123",
      },
    });

    const siteNameInput = screen.getByLabelText("Site name");
    fireEvent.change(siteNameInput, {
      target: {
        value: "Allrecipes",
      },
    });
    fireEvent.blur(siteNameInput);

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Best Pancakes"));
    expect(mutateAsync).toHaveBeenCalledWith({
      url: "https://allrecipes.com/recipe/123",
      siteName: "Allrecipes",
    });
  });

  it("shortens a YouTube URL on blur and restores it on undo", async () => {
    websitesData = [youtubeWebsite()];
    websiteLookupData = {
      exists: true,
      domain: "youtube.com",
      siteName: "YouTube",
    };
    autoFetchTitle = false;
    render(<BookmarkForm />);

    const urlInput = screen.getByLabelText("URL");
    const typed = "https://www.youtube.com/watch?v=4d9RSxd7Soo&list=PL123&index=96";
    fireEvent.change(urlInput, {
      target: {
        value: typed,
      },
    });
    fireEvent.blur(urlInput);

    await waitFor(() =>
      expect(urlInput).toHaveValue("https://www.youtube.com/watch?v=4d9RSxd7Soo"));

    const undo = await screen.findByRole("button", {
      name: "Undo",
    });
    fireEvent.click(undo);

    expect(urlInput).toHaveValue(typed);
  });

  it("saves the cleaned URL and records the typed original when editing", async () => {
    updateMutateAsync.mockResolvedValue(undefined);
    websitesData = [youtubeWebsite()];
    autoFetchTitle = false;
    const bookmark: Bookmark = {
      id: "11111111-1111-1111-1111-111111111111",
      url: "https://www.youtube.com/watch?v=old",
      originalUrl: null,
      title: "A video",
      description: null,
      image: null,
      categoryId: "22222222-2222-2222-2222-222222222222",
      website: null,
      mediaType: null,
      youtubeChannel: null,
      tags: [],
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [],
      priority: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
    };

    render(<BookmarkForm bookmark={bookmark} />);

    const urlInput = screen.getByLabelText("URL");
    const typed = "https://www.youtube.com/watch?v=4d9RSxd7Soo&list=PL123&index=96";
    fireEvent.change(urlInput, {
      target: {
        value: typed,
      },
    });
    fireEvent.blur(urlInput);

    await waitFor(() =>
      expect(urlInput).toHaveValue("https://www.youtube.com/watch?v=4d9RSxd7Soo"));

    fireEvent.click(screen.getByRole("button", {
      name: "Save changes",
    }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: bookmark.id,
        input: expect.objectContaining({
          url: "https://www.youtube.com/watch?v=4d9RSxd7Soo",
          originalUrl: typed,
        }),
      }),
    );
  });
});
