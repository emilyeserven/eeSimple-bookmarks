import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { FetchIsbnMetadataResult } from "@eesimple/types";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBookmarkIsbn } from "./useBookmarkIsbn";

const isbnMutateAsync = vi.fn<() => Promise<FetchIsbnMetadataResult>>();

vi.mock("../hooks/useFetchIsbnMetadata", () => ({
  useFetchIsbnMetadata: () => ({
    mutateAsync: isbnMutateAsync,
  }),
}));

vi.mock("../lib/notifications", () => ({
  notifyError: vi.fn(),
}));

/** A minimal `form` stub covering only the fields `useBookmarkIsbn` reads/writes. */
function makeForm(): BookmarkFormApi {
  const values: Record<string, unknown> = {
    title: "",
    description: "",
    personIds: [],
    publisherId: "",
    languageId: "",
  };
  return {
    getFieldValue: (name: string) => values[name],
    setFieldValue: (name: string, value: unknown) => {
      values[name] = value;
    },
  } as unknown as BookmarkFormApi;
}

const BASE_RESULT: FetchIsbnMetadataResult = {
  title: "The Hitchhiker's Guide to the Galaxy",
  description: null,
  coverUrl: null,
  authors: [],
  publisher: null,
  year: null,
  openLibraryUrl: null,
  language: null,
};

describe("useBookmarkIsbn handleIsbnFetch", () => {
  beforeEach(() => {
    isbnMutateAsync.mockReset();
  });

  it("feeds a public cover URL into the image-candidate picker", async () => {
    isbnMutateAsync.mockResolvedValue({
      ...BASE_RESULT,
      coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg",
    });
    const setImageCandidates = vi.fn();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [],
      mediaTypes: [],
      people: [],
      publishers: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createPublisher: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
    }));

    await result.current.handleIsbnFetch("9780345391803");

    await waitFor(() => {
      expect(setImageCandidates).toHaveBeenCalledWith([{
        url: "https://covers.openlibrary.org/b/id/1-L.jpg",
        width: null,
        height: null,
        source: "og",
      }]);
    });
  });

  it("does not treat a middleware-relative Kavita proxy path as a fetchable candidate", async () => {
    isbnMutateAsync.mockResolvedValue({
      ...BASE_RESULT,
      coverUrl: "/api/kavita/series/12/cover",
      kavitaSeriesId: 12,
    });
    const setImageCandidates = vi.fn();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [],
      mediaTypes: [],
      people: [],
      publishers: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createPublisher: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
    }));

    await result.current.handleIsbnFetch("9780345391803");

    expect(setImageCandidates).not.toHaveBeenCalled();
  });

  it("does not touch the image candidates when no cover is found", async () => {
    isbnMutateAsync.mockResolvedValue(BASE_RESULT);
    const setImageCandidates = vi.fn();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [],
      mediaTypes: [],
      people: [],
      publishers: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createPublisher: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
    }));

    await result.current.handleIsbnFetch("9780345391803");

    expect(setImageCandidates).not.toHaveBeenCalled();
  });
});
