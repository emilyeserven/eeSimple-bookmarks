import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchHontoIsbnFromPage } from "@/services/honto";

test("fetchHontoIsbnFromPage returns null for a non-honto URL without fetching", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("", {
      status: 200,
    });
  }) as typeof globalThis.fetch;
  try {
    const result = await fetchHontoIsbnFromPage("https://example.com/netstore/pd-book_12345678.html");
    assert.equal(result, null);
    assert.equal(called, false);
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchHontoIsbnFromPage extracts the ISBN-13 from the product page's structured details", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(
    "<tr><th>ISBN13</th><td>9780131103627</td></tr>",
    {
      status: 200,
    },
  )) as typeof globalThis.fetch;
  try {
    const result = await fetchHontoIsbnFromPage("https://honto.jp/netstore/pd-book_12345678.html");
    assert.equal(result, "9780131103627");
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchHontoIsbnFromPage returns null on a fetch failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(null, {
    status: 500,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchHontoIsbnFromPage("https://honto.jp/netstore/pd-book_12345678.html");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchHontoIsbnFromPage returns null when the page has no ISBN", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response("<html><body>no isbn here</body></html>", {
    status: 200,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchHontoIsbnFromPage("https://honto.jp/netstore/pd-book_12345678.html");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});
