import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchKavitaToc, resetKavitaAuthCache } from "@/services/kavita";
import { clearKavitaEnv, configureKavitaEnv as configure, stubFetchSequence } from "@/tests/kavitaTestUtils";

afterEach(() => {
  clearKavitaEnv();
  resetKavitaAuthCache();
});

const AUTH_OK = {
  status: 200,
  body: JSON.stringify({
    token: "jwt-token",
  }),
};

/** One volume whose first chapter is an EPUB (id 77, 320 pages). */
const VOLUMES_EPUB = JSON.stringify([
  {
    chapters: [
      {
        id: 77,
        pages: 320,
        files: [
          {
            format: 3,
          },
        ],
      },
    ],
  },
]);

/** Archive-only first volume, then a volume whose chapter carries a PDF file (id 88, 100 pages). */
const VOLUMES_PDF = JSON.stringify([
  {
    chapters: [
      {
        id: 5,
        pages: 40,
        files: [
          {
            format: 1,
          },
        ],
      },
    ],
  },
  {
    chapters: [
      {
        id: 88,
        pages: 100,
        files: [
          {
            format: 4,
          },
        ],
      },
    ],
  },
]);

/** Kavita's EPUB ToC (0-based pages), with one level-3 entry that must be dropped. */
const EPUB_CHAPTERS = JSON.stringify([
  {
    title: "Part I",
    page: 0,
    children: [
      {
        title: "Chapter 1",
        page: 2,
        children: [
          {
            title: "Section 1.1 (level 3 — dropped)",
            page: 3,
          },
        ],
      },
      {
        // Missing title — skipped.
        page: 5,
      },
    ],
  },
  {
    title: "Part II",
    page: 19,
  },
]);

test("fetchKavitaToc returns unavailable when unconfigured", async () => {
  assert.deepEqual(await fetchKavitaToc(12), {
    status: "unavailable",
  });
});

test("fetchKavitaToc reads an EPUB ToC via Kavita's book API, flattening two levels 1-based", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 200,
      body: VOLUMES_EPUB,
    },
    {
      status: 200,
      body: EPUB_CHAPTERS,
    },
  ]);
  try {
    const outcome = await fetchKavitaToc(12);
    assert.deepEqual(outcome, {
      status: "ok",
      result: {
        entries: [
          {
            title: "Part I",
            page: 1,
          },
          {
            title: "Chapter 1",
            page: 3,
          },
          {
            title: "Part II",
            page: 20,
          },
        ],
        pages: 320,
      },
    });
    assert.ok(requests[1].url.includes("/api/Series/volumes?seriesId=12"));
    assert.ok(requests[2].url.includes("/api/Book/77/chapters"));
  }
  finally {
    restore();
  }
});

test("fetchKavitaToc downloads a PDF (both auth forms) and extracts via the injected extractor", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 200,
      body: VOLUMES_PDF,
    },
    {
      status: 200,
      body: new TextEncoder().encode("%PDF-fake").buffer as ArrayBuffer,
    },
  ]);
  const seen: Uint8Array[] = [];
  try {
    const outcome = await fetchKavitaToc(44, {
      extractPdfToc: async (bytes) => {
        seen.push(bytes);
        return [
          {
            title: "Chapter 1",
            page: 4,
          },
        ];
      },
    });
    assert.deepEqual(outcome, {
      status: "ok",
      result: {
        entries: [
          {
            title: "Chapter 1",
            page: 4,
          },
        ],
        pages: 100,
      },
    });
    // The archive-only chapter is skipped; the PDF chapter (id 88) is downloaded with the apiKey
    // query param AND the Bearer JWT.
    const pdfRequest = requests[2];
    assert.ok(pdfRequest.url.includes("/api/Reader/pdf?chapterId=88&apiKey=secret-key"));
    const headers = pdfRequest.init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer jwt-token");
    assert.equal(seen.length, 1);
    assert.equal(new TextDecoder().decode(seen[0]), "%PDF-fake");
  }
  finally {
    restore();
  }
});

test("fetchKavitaToc rejects an over-cap PDF without calling the extractor", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 200,
      body: VOLUMES_PDF,
    },
    {
      status: 200,
      headers: {
        "content-length": String(200 * 1024 * 1024),
      },
    },
  ]);
  let extractorCalls = 0;
  try {
    const outcome = await fetchKavitaToc(44, {
      extractPdfToc: async () => {
        extractorCalls += 1;
        return [];
      },
    });
    assert.deepEqual(outcome, {
      status: "unavailable",
    });
    assert.equal(extractorCalls, 0);
  }
  finally {
    restore();
  }
});

test("fetchKavitaToc reports no_chapter when the series has no EPUB/PDF file", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 200,
      body: JSON.stringify([
        {
          chapters: [
            {
              id: 5,
              files: [
                {
                  format: 1,
                },
              ],
            },
          ],
        },
      ]),
    },
  ]);
  try {
    assert.deepEqual(await fetchKavitaToc(12), {
      status: "no_chapter",
    });
  }
  finally {
    restore();
  }
});

test("fetchKavitaToc reports unavailable when the volumes call fails", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 500,
    },
  ]);
  try {
    assert.deepEqual(await fetchKavitaToc(12), {
      status: "unavailable",
    });
  }
  finally {
    restore();
  }
});

test("fetchKavitaToc returns ok with empty entries when the book has no ToC", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    AUTH_OK,
    {
      status: 200,
      body: VOLUMES_EPUB,
    },
    {
      status: 200,
      body: JSON.stringify([]),
    },
  ]);
  try {
    assert.deepEqual(await fetchKavitaToc(12), {
      status: "ok",
      result: {
        entries: [],
        pages: 320,
      },
    });
  }
  finally {
    restore();
  }
});
