import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchAmazonIsbnFromPage } from "@/services/amazon";

test("fetchAmazonIsbnFromPage returns null for a non-Amazon URL without fetching", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("", {
      status: 200,
    });
  }) as typeof globalThis.fetch;
  try {
    const result = await fetchAmazonIsbnFromPage("https://example.com/dp/0131103628");
    assert.equal(result, null);
    assert.equal(called, false);
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchAmazonIsbnFromPage extracts the ISBN-13 from the product page's structured details", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(
    "<li><span>ISBN-13</span><span>‏ : ‎978-0131103627</span></li>",
    {
      status: 200,
    },
  )) as typeof globalThis.fetch;
  try {
    const result = await fetchAmazonIsbnFromPage("https://www.amazon.com/dp/B0BXYZ1234");
    assert.equal(result, "9780131103627");
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchAmazonIsbnFromPage returns null on a fetch failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(null, {
    status: 500,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchAmazonIsbnFromPage("https://www.amazon.com/dp/B0BXYZ1234");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchAmazonIsbnFromPage returns null when the page has no ISBN", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response("<html><body>no isbn here</body></html>", {
    status: 200,
  })) as typeof globalThis.fetch;
  try {
    const result = await fetchAmazonIsbnFromPage("https://www.amazon.com/dp/B0BXYZ1234");
    assert.equal(result, null);
  }
  finally {
    globalThis.fetch = original;
  }
});
