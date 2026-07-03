import type { ImageIntent } from "./bookmarkImageIntent";
import type { Bookmark, DisplayPreferenceSettings } from "@eesimple/types";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";
import { makeBookmark } from "../test-utils/factories";

const autoMutateAsync = vi.fn(async () => undefined);
const autoMutate = vi.fn(() => undefined);
const addMutateAsync = vi.fn(async () => ({
  id: "new-img",
}));
const fromCandidatesMutateAsync = vi.fn(async () => []);
const setMainMutateAsync = vi.fn(async () => undefined);
const deleteByIdMutateAsync = vi.fn(async () => undefined);
const takeScreenshotMutateAsync = vi.fn(async () => undefined);
const deleteScreenshotMutateAsync = vi.fn(async () => undefined);
const updateBookmarkMutate = vi.fn();
const scanMock = vi.fn(async () => ({
  imageCandidates: [{
    url: "https://e.com/a.jpg",
    source: "article",
  }],
}));

const pendingFalse = {
  isPending: false,
  error: null,
};

vi.mock("../hooks/useBookmarks", () => ({
  useAutoBookmarkImage: () => ({
    mutate: autoMutate,
    mutateAsync: autoMutateAsync,
    ...pendingFalse,
  }),
  useAddBookmarkImage: () => ({
    mutateAsync: addMutateAsync,
    ...pendingFalse,
  }),
  useBookmarkImagesFromCandidates: () => ({
    mutateAsync: fromCandidatesMutateAsync,
    ...pendingFalse,
  }),
  useSetMainBookmarkImage: () => ({
    mutateAsync: setMainMutateAsync,
    ...pendingFalse,
  }),
  useDeleteBookmarkImageById: () => ({
    mutateAsync: deleteByIdMutateAsync,
    ...pendingFalse,
  }),
  useTakeBookmarkScreenshot: () => ({
    mutateAsync: takeScreenshotMutateAsync,
    ...pendingFalse,
  }),
  useDeleteBookmarkScreenshot: () => ({
    mutateAsync: deleteScreenshotMutateAsync,
    ...pendingFalse,
  }),
  useKavitaCoverImage: () => ({
    mutate: vi.fn(),
    ...pendingFalse,
  }),
  usePlexPosterImage: () => ({
    mutate: vi.fn(),
    ...pendingFalse,
  }),
  useIsbnCoverImage: () => ({
    mutate: vi.fn(),
    ...pendingFalse,
  }),
  useUpdateBookmark: () => ({
    mutate: updateBookmarkMutate,
    ...pendingFalse,
  }),
}));

vi.mock("../hooks/useConnectors", () => ({
  useConnectors: () => ({
    data: undefined,
  }),
}));

vi.mock("../hooks/useBooks", () => ({
  useBookmarkKavitaSeriesId: (bookmark: { kavitaSeriesId: number | null }) => bookmark.kavitaSeriesId,
}));

vi.mock("../hooks/useMovies", () => ({
  useBookmarkPlexRatingKey: (bookmark: { plexRatingKey: string | null }) => bookmark.plexRatingKey,
}));

let displayPreferencesData: DisplayPreferenceSettings | undefined;

vi.mock("../hooks/useAppSettings", () => ({
  useDisplayPreferenceSettings: () => ({
    data: displayPreferencesData,
  }),
}));

vi.mock("../hooks/useCustomProperties", () => ({
  usePropertyBySlug: () => ({
    property: undefined,
  }),
}));

vi.mock("../lib/api/metadata", () => ({
  metadataApi: {
    scan: (...args: unknown[]) => scanMock(...(args as [])),
  },
}));

vi.mock("../lib/notifications", () => ({
  notifySuccess: vi.fn(),
}));

const bookmark: Bookmark = makeBookmark({
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://example.com/page",
});

const fakeEvent = {
  preventDefault: () => undefined,
} as React.FormEvent;

async function submitWith(over: Partial<ImageIntent>) {
  const {
    result,
  } = renderHook(() => useBookmarkImageEditForm(bookmark));
  act(() => {
    result.current.onImageChange({
      ...EMPTY_IMAGE_INTENT,
      ...over,
    });
  });
  await act(async () => {
    result.current.onSubmit(fakeEvent);
  });
  return result;
}

describe("useBookmarkImageEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    displayPreferencesData = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("adds a staged upload on submit, marking it main", async () => {
    const file = new File(["x"], "pic.png", {
      type: "image/png",
    });
    await submitWith({
      uploads: [file],
      mainSelection: {
        kind: "upload",
        index: 0,
      },
    });
    expect(addMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      file,
      main: true,
    });
    expect(autoMutateAsync).not.toHaveBeenCalled();
  });

  it("captures kept candidates on submit", async () => {
    await submitWith({
      keepCandidateUrls: ["https://e.com/a.jpg"],
    });
    expect(fromCandidatesMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      urls: ["https://e.com/a.jpg"],
      mainUrl: null,
    });
  });

  it("removes a staged existing image on submit", async () => {
    await submitWith({
      removeImageIds: ["old-1"],
    });
    expect(deleteByIdMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      imageId: "old-1",
    });
  });

  it("auto-fetches the page image when the auto fallback is set and nothing else is chosen", async () => {
    await submitWith({
      auto: true,
    });
    expect(autoMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      sourceUrl: bookmark.url,
    });
  });

  it("calls no image mutation when nothing is staged", async () => {
    await submitWith({});
    expect(addMutateAsync).not.toHaveBeenCalled();
    expect(autoMutateAsync).not.toHaveBeenCalled();
    expect(fromCandidatesMutateAsync).not.toHaveBeenCalled();
    expect(deleteByIdMutateAsync).not.toHaveBeenCalled();
  });

  it("scans the page for candidates on find-images", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    await act(async () => {
      result.current.onFindImages();
    });
    expect(scanMock).toHaveBeenCalled();
    expect(result.current.candidates).toEqual([{
      url: "https://e.com/a.jpg",
      source: "article",
    }]);
  });

  it("clears candidates after a successful save", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    await act(async () => {
      result.current.onFindImages();
    });
    expect(result.current.candidates).toHaveLength(1);
    await act(async () => {
      result.current.onSubmit(fakeEvent);
    });
    expect(result.current.candidates).toHaveLength(0);
  });

  it("fetches the page image directly on get-page-image", () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    act(() => {
      result.current.onGetPageImage();
    });
    expect(autoMutate).toHaveBeenCalledWith({
      id: bookmark.id,
      sourceUrl: bookmark.url,
    });
  });

  it("takes a screenshot with the selected delay, and remove sends no delay", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    act(() => {
      result.current.setScreenshotDelayMs(5000);
    });
    act(() => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: 5000,
      width: 1280,
      height: 720,
      scrollDistance: undefined,
    });

    act(() => {
      result.current.onDeleteScreenshot();
    });
    expect(deleteScreenshotMutateAsync).toHaveBeenCalledWith(bookmark.id);
  });

  it("omits delayMs when the delay is zero", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    act(() => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: undefined,
      width: 1280,
      height: 720,
      scrollDistance: undefined,
    });
  });

  it("takes a screenshot with the selected size", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    act(() => {
      result.current.setScreenshotSize(1920, 1080);
    });
    act(() => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: undefined,
      width: 1920,
      height: 1080,
      scrollDistance: undefined,
    });
  });

  it("pre-fills the screenshot controls from the Screenshot Defaults settings", async () => {
    displayPreferencesData = {
      bookmarkDetailImageSize: "medium",
      bookmarkDetailVideoSize: "standard",
      bookmarkDetailLayout: "single",
      filtersInDrawer: false,
      filtersHidden: false,
      panelPinned: false,
      drawerUnpinnedBreakpoints: [768],
      croppedWidth: 16,
      croppedHeight: 9,
      customPropertyTypeIcons: null,
      onDemandFilters: [],
      showRomanizedByDefault: false,
      sortByRomanized: true,
      minAreaPinThresholdKm2: 0,
      bookmarksPerPage: 25,
      mapPinScale: 1,
      screenshotDefaultDelayMs: 10000,
      screenshotDefaultWidth: 1920,
      screenshotDefaultHeight: 1080,
      screenshotDefaultScrollDistance: 2000,
    };
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    await act(async () => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: 10000,
      width: 1920,
      height: 1080,
      scrollDistance: 2000,
    });
  });

  it("takes a screenshot with the selected scroll distance", async () => {
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmark));
    act(() => {
      result.current.setScreenshotScrollDistance(2000);
    });
    act(() => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: undefined,
      width: 1280,
      height: 720,
      scrollDistance: 2000,
    });
  });

  it("prefills the screenshot settings from the bookmark's last-used settings", async () => {
    const bookmarkWithSettings = makeBookmark({
      id: bookmark.id,
      url: bookmark.url,
      screenshotSettings: {
        delayMs: 5000,
        width: 1920,
        height: 1080,
        scrollDistance: 2000,
      },
    });
    const {
      result,
    } = renderHook(() => useBookmarkImageEditForm(bookmarkWithSettings));
    expect(result.current.screenshotDelayMs).toBe(5000);
    expect(result.current.screenshotWidth).toBe(1920);
    expect(result.current.screenshotHeight).toBe(1080);
    expect(result.current.screenshotScrollDistance).toBe(2000);

    act(() => {
      result.current.onTakeScreenshot();
    });
    expect(takeScreenshotMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      delayMs: 5000,
      width: 1920,
      height: 1080,
      scrollDistance: 2000,
    });
  });
});
