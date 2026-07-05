import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { FetchIsbnMetadataResult } from "@eesimple/types";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ISBN_SLUG } from "./bookmarkFormSchema";
import { useBookmarkIsbn } from "./useBookmarkIsbn";
import { makeCustomProperty, makeMediaType } from "../test-utils/factories";

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
    groupId: "",
    mediaTypeId: "",
  };
  return {
    getFieldValue: (name: string) => values[name],
    setFieldValue: (name: string, value: unknown) => {
      values[name] = value;
    },
  } as unknown as BookmarkFormApi;
}

/** A no-op `primaryLanguage` stub — these tests don't exercise language auto-detect. */
function makePrimaryLanguage() {
  return {
    primaryLanguageLevelId: undefined,
    hasPrimaryLanguageUsage: () => true,
    attachPrimaryLanguageUsage: vi.fn(),
    pendingLanguageUsagesRef: {
      current: [],
    },
    siteLanguageCodeRef: {
      current: null as string | null,
    },
    stageDetectedSiteLanguageCode: vi.fn(),
  };
}

const BASE_RESULT: FetchIsbnMetadataResult = {
  title: "The Hitchhiker's Guide to the Galaxy",
  description: null,
  coverUrl: null,
  authors: [],
  group: null,
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
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
      primaryLanguage: makePrimaryLanguage(),
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
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
      primaryLanguage: makePrimaryLanguage(),
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
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates,
      primaryLanguage: makePrimaryLanguage(),
    }));

    await result.current.handleIsbnFetch("9780345391803");

    expect(setImageCandidates).not.toHaveBeenCalled();
  });

  it("stages the detected language for the create payload even when a primary language usage already exists", async () => {
    isbnMutateAsync.mockResolvedValue({
      ...BASE_RESULT,
      language: "ja",
    });
    // hasPrimaryLanguageUsage() returns true in the stub, so the usage-attach path is skipped —
    // the entity_names label (#985) must still be staged, since it doesn't depend on a usage level.
    const primaryLanguage = makePrimaryLanguage();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [],
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange: vi.fn(),
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates: vi.fn(),
      primaryLanguage,
    }));

    await result.current.handleIsbnFetch("9780345391803");

    expect(primaryLanguage.stageDetectedSiteLanguageCode).toHaveBeenCalledWith("ja");
  });
});

describe("useBookmarkIsbn handleAmazonIsbnDetected", () => {
  beforeEach(() => {
    isbnMutateAsync.mockReset();
    isbnMutateAsync.mockResolvedValue(BASE_RESULT);
  });

  const isbnProp = makeCustomProperty({
    id: "isbn-prop",
    slug: ISBN_SLUG,
  });
  const bookMediaType = makeMediaType({
    id: "book-mt",
    name: "Book",
  });

  it("fills the empty ISBN property, defaults the media type, and fetches metadata", async () => {
    const handleTextChange = vi.fn();
    const form = makeForm();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form,
      customProperties: [isbnProp],
      textInputs: {},
      mediaTypes: [bookMediaType],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange,
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates: vi.fn(),
      primaryLanguage: makePrimaryLanguage(),
    }));

    await result.current.handleAmazonIsbnDetected("9780131103627");

    expect(handleTextChange).toHaveBeenCalledWith("isbn-prop", "9780131103627");
    expect(form.getFieldValue("mediaTypeId")).toBe("book-mt");
    expect(isbnMutateAsync).toHaveBeenCalledWith({
      isbn: "9780131103627",
    });
  });

  it("no-ops when the ISBN property already has a value", async () => {
    const handleTextChange = vi.fn();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [isbnProp],
      textInputs: {
        "isbn-prop": "9780000000002",
      },
      mediaTypes: [bookMediaType],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange,
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates: vi.fn(),
      primaryLanguage: makePrimaryLanguage(),
    }));

    await result.current.handleAmazonIsbnDetected("9780131103627");

    expect(handleTextChange).not.toHaveBeenCalled();
    expect(isbnMutateAsync).not.toHaveBeenCalled();
  });
});

describe("useBookmarkIsbn handleIsbnFieldFetch", () => {
  beforeEach(() => {
    isbnMutateAsync.mockReset();
    isbnMutateAsync.mockResolvedValue(BASE_RESULT);
  });

  it("normalizes a manually-typed ISBN-10 to ISBN-13 before storing and fetching", async () => {
    const handleTextChange = vi.fn();
    const isbnProp = makeCustomProperty({
      id: "isbn-prop",
      slug: ISBN_SLUG,
    });
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [isbnProp],
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange,
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates: vi.fn(),
      primaryLanguage: makePrimaryLanguage(),
    }));

    await result.current.handleIsbnFieldFetch("0131103628");

    expect(handleTextChange).toHaveBeenCalledWith("isbn-prop", "9780131103627");
    expect(isbnMutateAsync).toHaveBeenCalledWith({
      isbn: "9780131103627",
    });
  });

  it("leaves an already-ISBN-13 value alone (no redundant write)", async () => {
    const handleTextChange = vi.fn();
    const {
      result,
    } = renderHook(() => useBookmarkIsbn({
      form: makeForm(),
      customProperties: [],
      textInputs: {},
      mediaTypes: [],
      people: [],
      groups: [],
      languages: [],
      createPerson: {
        mutateAsync: vi.fn(),
      } as never,
      createGroup: {
        mutateAsync: vi.fn(),
      } as never,
      createLanguage: {
        mutateAsync: vi.fn(),
      } as never,
      handleTextChange,
      setHideNameField: vi.fn(),
      setScanned: vi.fn(),
      setImageCandidates: vi.fn(),
      primaryLanguage: makePrimaryLanguage(),
    }));

    await result.current.handleIsbnFieldFetch("9780131103627");

    expect(handleTextChange).not.toHaveBeenCalled();
    expect(isbnMutateAsync).toHaveBeenCalledWith({
      isbn: "9780131103627",
    });
  });
});
