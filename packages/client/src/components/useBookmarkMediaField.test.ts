import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_MEDIA_SELECTION, mediaSelectionFromBookmark, useBookmarkMediaField } from "./useBookmarkMediaField";
import { makeBookmark } from "../test-utils/factories";

const MOVIES = [{
  id: "movie-1",
  name: "Movie One",
}];
const BOOKS = [{
  id: "book-1",
  name: "Book One",
}];
const TV_SHOWS = [{
  id: "show-1",
  name: "Show One",
}];

vi.mock("../hooks/useBooks", () => ({
  useBooks: () => ({
    data: BOOKS,
  }),
}));
vi.mock("../hooks/useMovies", () => ({
  useMovies: () => ({
    data: MOVIES,
  }),
}));
vi.mock("../hooks/useTvShows", () => ({
  useTvShows: () => ({
    data: TV_SHOWS,
  }),
}));
vi.mock("../hooks/useEpisodes", () => ({
  useEpisodes: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useAlbums", () => ({
  useAlbums: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useTracks", () => ({
  useTracks: () => ({
    data: [],
  }),
}));

describe("useBookmarkMediaField", () => {
  it("starts with every section expanded and unlinked when the bookmark has no media", () => {
    const onSelect = vi.fn();
    const bookmark = makeBookmark();
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), onSelect, bookmark));

    expect(result.current.isLinked).toBe(false);
    expect(result.current.selectedLabel).toBeNull();
    expect(result.current.sections).toHaveLength(6);
    for (const section of result.current.sections) {
      expect(section.collapsed).toBe(false);
    }
    const movies = result.current.sections.find(section => section.kind === "movie");
    expect(movies?.items.map(item => item.name)).toEqual(["Movie One"]);
  });

  it("resolves the linked row's name from whichever FK is set", () => {
    const bookmark = makeBookmark({
      movieId: "movie-1",
    });
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), vi.fn(), bookmark));

    expect(result.current.isLinked).toBe(true);
    expect(result.current.selectedLabel).toBe("Movie One");
  });

  it("toggling a section's collapse hides its items until toggled back", () => {
    const bookmark = makeBookmark();
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), vi.fn(), bookmark));

    const bookSection = () => result.current.sections.find(section => section.kind === "book")!;
    expect(bookSection().collapsed).toBe(false);
    expect(bookSection().items).toHaveLength(1);

    act(() => bookSection().onToggleCollapsed());
    expect(bookSection().collapsed).toBe(true);
    expect(bookSection().items).toHaveLength(0);

    act(() => bookSection().onToggleCollapsed());
    expect(bookSection().collapsed).toBe(false);
    expect(bookSection().items).toHaveLength(1);
  });

  it("surfaces matches in a collapsed section without expanding it, once a search query is active", () => {
    const bookmark = makeBookmark();
    const {
      result,
      rerender,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), vi.fn(), bookmark));

    const bookSection = () => result.current.sections.find(section => section.kind === "book")!;
    act(() => bookSection().onToggleCollapsed());
    expect(bookSection().collapsed).toBe(true);

    act(() => result.current.setQuery("Book One"));
    rerender();
    expect(bookSection().collapsed).toBe(false);
    expect(bookSection().items.map(item => item.name)).toEqual(["Book One"]);

    act(() => result.current.setQuery(""));
    rerender();
    expect(bookSection().collapsed).toBe(true);
    expect(bookSection().items).toHaveLength(0);
  });

  it("selecting an item produces an all-null-except-one MediaSelection", () => {
    const onSelect = vi.fn();
    const bookmark = makeBookmark();
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), onSelect, bookmark));

    act(() => result.current.selectItem("movie", "movie-1"));
    expect(onSelect).toHaveBeenCalledWith({
      ...EMPTY_MEDIA_SELECTION,
      movieId: "movie-1",
    });
  });

  it("re-selecting the already-linked item clears it (toggle-off)", () => {
    const onSelect = vi.fn();
    const bookmark = makeBookmark({
      movieId: "movie-1",
    });
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), onSelect, bookmark));

    act(() => result.current.selectItem("movie", "movie-1"));
    expect(onSelect).toHaveBeenCalledWith(EMPTY_MEDIA_SELECTION);
  });

  it("handleCreated links the newly created title by its FK key", () => {
    const onSelect = vi.fn();
    const bookmark = makeBookmark();
    const {
      result,
    } = renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(bookmark), onSelect, bookmark));

    act(() => result.current.handleCreated({
      key: "tvShowId",
      id: "show-1",
    }));
    expect(onSelect).toHaveBeenCalledWith({
      ...EMPTY_MEDIA_SELECTION,
      tvShowId: "show-1",
    });
  });

  it("shows the legacy Kavita fallback only when unlinked from a Book but a legacy series is set", () => {
    const linkedViaBook = makeBookmark({
      bookId: "book-1",
      kavitaSeriesId: 42,
    });
    const legacyOnly = makeBookmark({
      kavitaSeriesId: 42,
    });

    expect(renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(linkedViaBook), vi.fn(), linkedViaBook)).result.current.showLegacyKavita).toBe(false);
    expect(renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(legacyOnly), vi.fn(), legacyOnly)).result.current.showLegacyKavita).toBe(true);
  });

  it("shows the legacy Plex fallback only when no taxonomy FK is linked but a legacy rating key is set", () => {
    const linkedViaMovie = makeBookmark({
      movieId: "movie-1",
      plexRatingKey: "abc",
    });
    const legacyOnly = makeBookmark({
      plexRatingKey: "abc",
    });

    expect(renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(linkedViaMovie), vi.fn(), linkedViaMovie)).result.current.showLegacyPlex).toBe(false);
    expect(renderHook(() => useBookmarkMediaField(mediaSelectionFromBookmark(legacyOnly), vi.fn(), legacyOnly)).result.current.showLegacyPlex).toBe(true);
  });
});
