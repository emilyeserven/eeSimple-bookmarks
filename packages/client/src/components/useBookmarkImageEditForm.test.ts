import type { Bookmark } from "@eesimple/types";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBookmarkImageEditForm } from "./useBookmarkImageEditForm";
import { makeBookmark } from "../test-utils/factories";

const uploadMutateAsync = vi.fn(async () => undefined);
const autoMutateAsync = vi.fn(async () => undefined);
const deleteMutateAsync = vi.fn(async () => undefined);
const takeScreenshotMutateAsync = vi.fn(async () => undefined);
const deleteScreenshotMutateAsync = vi.fn(async () => undefined);

vi.mock("../hooks/useBookmarks", () => ({
  useUploadBookmarkImage: () => ({
    mutateAsync: uploadMutateAsync,
    isPending: false,
    error: null,
  }),
  useAutoBookmarkImage: () => ({
    mutateAsync: autoMutateAsync,
    isPending: false,
    error: null,
  }),
  useDeleteBookmarkImage: () => ({
    mutateAsync: deleteMutateAsync,
    isPending: false,
    error: null,
  }),
  useTakeBookmarkScreenshot: () => ({
    mutateAsync: takeScreenshotMutateAsync,
    isPending: false,
    error: null,
  }),
  useDeleteBookmarkScreenshot: () => ({
    mutateAsync: deleteScreenshotMutateAsync,
    isPending: false,
    error: null,
  }),
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

async function submitWith(intent: { file?: File | null;
  auto?: boolean;
  remove?: boolean; }) {
  const {
    result,
  } = renderHook(() => useBookmarkImageEditForm(bookmark));
  act(() => {
    result.current.onImageChange({
      file: null,
      auto: false,
      remove: false,
      ...intent,
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a staged file on submit", async () => {
    const file = new File(["x"], "pic.png", {
      type: "image/png",
    });
    await submitWith({
      file,
    });
    expect(uploadMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      file,
    });
    expect(autoMutateAsync).not.toHaveBeenCalled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
  });

  it("auto-fetches the page image when the auto intent is set", async () => {
    await submitWith({
      auto: true,
    });
    expect(autoMutateAsync).toHaveBeenCalledWith({
      id: bookmark.id,
      sourceUrl: bookmark.url,
    });
    expect(uploadMutateAsync).not.toHaveBeenCalled();
  });

  it("deletes the image when the remove intent is set", async () => {
    await submitWith({
      remove: true,
    });
    expect(deleteMutateAsync).toHaveBeenCalledWith(bookmark.id);
  });

  it("file intent wins over auto and remove when several are set", async () => {
    const file = new File(["x"], "pic.png", {
      type: "image/png",
    });
    await submitWith({
      file,
      auto: true,
      remove: true,
    });
    expect(uploadMutateAsync).toHaveBeenCalledTimes(1);
    expect(autoMutateAsync).not.toHaveBeenCalled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
  });

  it("calls no image mutation when nothing is staged", async () => {
    await submitWith({});
    expect(uploadMutateAsync).not.toHaveBeenCalled();
    expect(autoMutateAsync).not.toHaveBeenCalled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
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
    });
  });
});
