import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchIsbnMetadata } from "@/services/isbn";
import { resetKavitaAuthCache } from "@/services/kavita";

const ISBN = "9780345391803";

const KAVITA_ENV_KEYS = ["KAVITA_ENDPOINT", "KAVITA_API_KEY"];

afterEach(() => {
  for (const k of KAVITA_ENV_KEYS) delete process.env[k];
  resetKavitaAuthCache();
});

const OPEN_LIBRARY_HIT = JSON.stringify({
  [`ISBN:${ISBN}`]: {
    title: "The Hitchhiker's Guide to the Galaxy",
    description: "A comedic science-fiction series.",
    cover: {
      large: "https://covers.openlibrary.org/b/id/1-L.jpg",
      medium: "https://covers.openlibrary.org/b/id/1-M.jpg",
    },
    authors: [{
      name: "Douglas Adams",
    }],
    publishers: [{
      name: "Del Rey",
    }],
    publish_date: "1995",
    url: "https://openlibrary.org/books/OL1M",
  },
});

const GOOGLE_BOOKS_HIT = JSON.stringify({
  items: [{
    volumeInfo: {
      title: "The Restaurant at the End of the Universe",
      description: "The second book.",
      authors: ["Douglas Adams"],
      publisher: "Pan Books",
      publishedDate: "1980",
      imageLinks: {
        thumbnail: "http://books.google.com/books/content?id=2&img=1",
      },
    },
  }],
});

/** Route `global.fetch` by host so each provider can be stubbed independently. */
function stubByHost(handlers: {
  openLibrary?: () => Response;
  google?: () => Response;
  kavitaSearch?: () => Response;
  kavitaSeriesForChapter?: () => Response;
}): () => void {
  const original = global.fetch;
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("openlibrary.org")) {
      return handlers.openLibrary?.() ?? new Response("{}", {
        status: 200,
      });
    }
    if (url.includes("googleapis.com")) {
      return handlers.google?.() ?? new Response("{}", {
        status: 200,
      });
    }
    if (url.includes("kavita-server")) {
      if (url.includes("/api/Plugin/authenticate")) {
        return new Response(JSON.stringify({
          token: "test-jwt",
        }), {
          status: 200,
        });
      }
      if (url.includes("/api/Search/series-for-chapter")) {
        return handlers.kavitaSeriesForChapter?.() ?? new Response("{}", {
          status: 404,
        });
      }
      return handlers.kavitaSearch?.() ?? new Response(JSON.stringify({
        series: [],
        chapters: [],
      }), {
        status: 200,
      });
    }
    return new Response("{}", {
      status: 404,
    });
  }) as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

test("fetchIsbnMetadata returns the Open Library result when found", async () => {
  const restore = stubByHost({
    openLibrary: () => new Response(OPEN_LIBRARY_HIT, {
      headers: {
        "content-type": "application/json",
      },
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "ok");
    assert.equal(outcome.kind === "ok" ? outcome.result.title : null, "The Hitchhiker's Guide to the Galaxy");
    assert.equal(outcome.kind === "ok" ? outcome.result.coverUrl : null, "https://covers.openlibrary.org/b/id/1-L.jpg");
    assert.deepEqual(outcome.kind === "ok" ? outcome.result.authors : [], ["Douglas Adams"]);
    assert.equal(outcome.kind === "ok" ? outcome.result.openLibraryUrl : null, "https://openlibrary.org/books/OL1M");
  }
  finally {
    restore();
  }
});

test("fetchIsbnMetadata falls back to Google Books when Open Library misses", async () => {
  const restore = stubByHost({
    openLibrary: () => new Response("{}", {
      headers: {
        "content-type": "application/json",
      },
    }),
    google: () => new Response(GOOGLE_BOOKS_HIT, {
      headers: {
        "content-type": "application/json",
      },
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "ok");
    assert.equal(outcome.kind === "ok" ? outcome.result.title : null, "The Restaurant at the End of the Universe");
    assert.equal(outcome.kind === "ok" ? outcome.result.publisher : null, "Pan Books");
    // Google Books http thumbnails are upgraded to https.
    assert.equal(outcome.kind === "ok" ? outcome.result.coverUrl : null, "https://books.google.com/books/content?id=2&img=1");
    // No Open Library page for a Google-Books-sourced result.
    assert.equal(outcome.kind === "ok" ? outcome.result.openLibraryUrl : "x", null);
  }
  finally {
    restore();
  }
});

test("fetchIsbnMetadata reports not_found when both providers miss", async () => {
  const restore = stubByHost({
    openLibrary: () => new Response("{}", {
      headers: {
        "content-type": "application/json",
      },
    }),
    google: () => new Response(JSON.stringify({
      totalItems: 0,
    }), {
      headers: {
        "content-type": "application/json",
      },
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "not_found");
    assert.match(outcome.kind === "not_found" ? (outcome.debug ?? "") : "", /no server configured/);
  }
  finally {
    restore();
  }
});

test("fetchIsbnMetadata falls back to Kavita when both public providers miss and Kavita is configured", async () => {
  process.env.KAVITA_ENDPOINT = "http://kavita-server:5000";
  process.env.KAVITA_API_KEY = "secret-key";
  const restore = stubByHost({
    openLibrary: () => new Response("{}", {
      headers: {
        "content-type": "application/json",
      },
    }),
    google: () => new Response(JSON.stringify({
      totalItems: 0,
    }), {
      headers: {
        "content-type": "application/json",
      },
    }),
    kavitaSearch: () => new Response(JSON.stringify({
      series: [],
      chapters: [{
        id: 77,
        isbn: ISBN,
      }],
    }), {
      status: 200,
    }),
    kavitaSeriesForChapter: () => new Response(JSON.stringify({
      id: 12,
      libraryId: 3,
      name: "The Hitchhiker's Guide to the Galaxy",
      libraryName: "Books",
    }), {
      status: 200,
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "ok");
    assert.equal(outcome.kind === "ok" ? outcome.result.title : null, "The Hitchhiker's Guide to the Galaxy");
    assert.equal(outcome.kind === "ok" ? outcome.result.publisher : null, "Books");
    assert.equal(outcome.kind === "ok" ? outcome.result.coverUrl : null, "/api/kavita/series/12/cover");
  }
  finally {
    restore();
  }
});

test("fetchIsbnMetadata still reports not_found when Kavita is configured but has no match", async () => {
  process.env.KAVITA_ENDPOINT = "http://kavita-server:5000";
  process.env.KAVITA_API_KEY = "secret-key";
  const restore = stubByHost({
    openLibrary: () => new Response("{}", {
      headers: {
        "content-type": "application/json",
      },
    }),
    google: () => new Response(JSON.stringify({
      totalItems: 0,
    }), {
      headers: {
        "content-type": "application/json",
      },
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "not_found");
    assert.match(outcome.kind === "not_found" ? (outcome.debug ?? "") : "", /no book has this ISBN/);
  }
  finally {
    restore();
  }
});

test("fetchIsbnMetadata reports error when both providers are unreachable", async () => {
  const restore = stubByHost({
    openLibrary: () => new Response("", {
      status: 503,
    }),
    google: () => new Response("", {
      status: 503,
    }),
  });
  try {
    const outcome = await fetchIsbnMetadata(ISBN);
    assert.equal(outcome.kind, "error");
  }
  finally {
    restore();
  }
});
