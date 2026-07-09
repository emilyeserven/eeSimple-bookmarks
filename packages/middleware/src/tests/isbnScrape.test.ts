import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchIsbnFromPage } from "@/services/isbnScrape";

test("fetchIsbnFromPage extracts the ISBN-13 from the page's structured details", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(
    "<tr><th>ISBN-13</th><td>9780131103627</td></tr>",
    {
      status: 200,
    },
  )) as typeof globalThis.fetch;
  try {
    const result = await fetchIsbnFromPage("https://example.com/books/some-title");
    assert.equal(result, "9780131103627");
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchIsbnFromPage returns null on a fetch failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(null, {
    status: 500,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchIsbnFromPage("https://example.com/books/some-title");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchIsbnFromPage returns null when the page has no ISBN", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response("<html><body>no isbn here</body></html>", {
    status: 200,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchIsbnFromPage("https://example.com/books/some-title");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});
