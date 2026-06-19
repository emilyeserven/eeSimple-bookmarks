import type { Bookmark, Website } from "@eesimple/types";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkForm } from "./BookmarkForm";

// The form pulls data from several query hooks and the UI store; stub them so the
// test can focus on the reveal / title-fetch / save behavior without a live API or QueryClient.
const mutateAsync = vi.fn<(args: { url: string;
  siteName?: string; }) => Promise<{ title: string }>>();
let autoFetchTitle = true;
let websiteLookupData:
  | { exists: boolean;
    domain: string | null;
    siteName: string | null; }
    | undefined;
let websitesData: Website[] = [];
let categoriesData: { id: string;
  name: string;
  builtIn: boolean; }[] = [];

const createMutateAsync = vi.fn<(args: unknown) => Promise<{ id: string }>>();
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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock("../hooks/useBookmarks", () => ({
  useCreateBookmark: () => ({
    mutateAsync: createMutateAsync,
    isError: false,
    isPending: false,
    error: null,
  }),
  useUpdateBookmark: () => ({
    mutateAsync: updateMutateAsync,
    isError: false,
    isPending: false,
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
  useBookmarkUrlDuplicateCheck: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
vi.mock("../hooks/useCategories", () => ({
  useCategories: () => ({
    data: categoriesData,
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
  useCreateAutofillRule: () => ({
    mutateAsync: vi.fn(),
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

/** Type a URL and click "Check URL" to reveal the rest of a fresh (create) form. */
async function revealForm(url: string): Promise<void> {
  fireEvent.change(screen.getByLabelText("URL"), {
    target: {
      value: url,
    },
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Check URL",
  }));
  await screen.findByLabelText("Name");
}

describe("BookmarkForm progressive disclosure", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    createMutateAsync.mockReset();
    createMutateAsync.mockResolvedValue({
      id: "new-id",
    });
    updateMutateAsync.mockReset();
    autoFetchTitle = true;
    websiteLookupData = undefined;
    websitesData = [];
    categoriesData = [{
      id: "cat-1",
      name: "Default",
      builtIn: true,
    }];
  });

  it("shows only the URL field until the URL is checked", () => {
    render(<BookmarkForm />);

    expect(screen.getByLabelText("URL")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Check URL",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Add Now",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Add Bookmark",
    })).not.toBeInTheDocument();
  });

  it("reveals the form and fills the Name when Check URL is clicked", async () => {
    mutateAsync.mockResolvedValue({
      title: "Example Domain",
    });
    render(<BookmarkForm />);

    await revealForm("https://example.com");

    expect(screen.getByLabelText("Name")).toHaveValue("Example Domain");
    // The primary action flips to "Add Bookmark"; the pre-scan buttons are gone.
    expect(screen.getByRole("button", {
      name: "Add Bookmark",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Check URL",
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Add Now",
    })).not.toBeInTheDocument();
  });

  it("fills the Name field when the manual fetch button is clicked", async () => {
    mutateAsync.mockResolvedValue({
      title: "Example Domain",
    });
    render(<BookmarkForm />);
    await revealForm("https://example.com");

    mutateAsync.mockClear();
    mutateAsync.mockResolvedValue({
      title: "Re-fetched Title",
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Fetch title from URL",
    }));

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("Re-fetched Title"));
    expect(mutateAsync).toHaveBeenCalledWith({
      url: "https://example.com",
      siteName: undefined,
    });
  });

  it("Add Now saves with a host-fallback title and omits server-filled fields", async () => {
    render(<BookmarkForm />);

    fireEvent.change(screen.getByLabelText("URL"), {
      target: {
        value: "https://example.com",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Add Now",
    }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledTimes(1));
    const input = createMutateAsync.mock.calls[0][0] as Record<string, unknown>;
    expect(input).toMatchObject({
      url: "https://example.com",
      title: "example.com",
      originalUrl: null,
    });
    // Media type, video length, and priority are filled by the server, never sent by the form.
    expect(input).not.toHaveProperty("mediaTypeId");
    expect(input).not.toHaveProperty("priority");
    // The page-title endpoint is never hit on the quick path.
    expect(mutateAsync).not.toHaveBeenCalled();
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
    await revealForm("https://allrecipes.com/recipe/123");

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

  it("cleans a YouTube URL when checked and restores it on undo", async () => {
    websitesData = [youtubeWebsite()];
    websiteLookupData = {
      exists: true,
      domain: "youtube.com",
      siteName: "YouTube",
    };
    autoFetchTitle = false;
    render(<BookmarkForm />);

    const typed = "https://www.youtube.com/watch?v=4d9RSxd7Soo&list=PL123&index=96";
    fireEvent.change(screen.getByLabelText("URL"), {
      target: {
        value: typed,
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Check URL",
    }));

    // Re-query the URL input after revealing: gaining the cleanup-toggle action remounts it.
    await waitFor(() =>
      expect(screen.getByLabelText("URL")).toHaveValue("https://www.youtube.com/watch?v=4d9RSxd7Soo"));

    const undo = await screen.findByRole("button", {
      name: "Undo",
    });
    fireEvent.click(undo);

    expect(screen.getByLabelText("URL")).toHaveValue(typed);
  });
});

describe("BookmarkForm editing", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    createMutateAsync.mockReset();
    updateMutateAsync.mockReset();
    autoFetchTitle = true;
    websiteLookupData = undefined;
    websitesData = [];
    categoriesData = [];
  });

  it("renders the full form immediately and updates the bookmark", async () => {
    updateMutateAsync.mockResolvedValue(undefined);
    const onDone = vi.fn();
    const bookmark: Bookmark = {
      id: "11111111-1111-1111-1111-111111111111",
      url: "https://github.com",
      originalUrl: null,
      title: "GitHub",
      description: "Code host",
      image: null,
      imageAutoGrabError: null,
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

    // No URL-only gate when editing: Name is present from the start.
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
      imageAutoGrabError: null,
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
