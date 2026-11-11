import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildMymindImportCards,
  mymindCardTitle,
  mymindTagStats,
  mymindTypeMediaTypeCandidates,
  parseCsv,
  parseMymindCsv,
  splitMymindTags,
  splitPrefixedTag,
} from "./mymindImport.js";

import type { MymindCsvRow } from "./mymindImport.js";

const HEADER = "﻿id,type,title,url,content,note,tags,created";

function row(overrides: Partial<MymindCsvRow>): MymindCsvRow {
  return {
    id: "a",
    type: "WebPage",
    title: "",
    url: "",
    content: "",
    note: "",
    tags: "",
    created: "",
    ...overrides,
  };
}

test("parseCsv handles quotes, escaped quotes, embedded newlines, CRLF and a BOM", () => {
  const rows = parseCsv("﻿a,b\r\n\"x, y\",\"say \"\"hi\"\"\nthere\"\r\n\r\nlast,\n");
  assert.deepEqual(rows, [["a", "b"], ["x, y", "say \"hi\"\nthere"], ["last", ""]]);
});

test("parseMymindCsv maps columns by header name", () => {
  const rows = parseMymindCsv(`${HEADER}\nid1,Image,Logo,,,\"a note\",\"des: Studio,flat\",2025-02-07T17:56:32Z\n`);
  assert.equal(rows?.length, 1);
  assert.equal(rows?.[0]?.title, "Logo");
  assert.equal(rows?.[0]?.note, "a note");
  assert.equal(rows?.[0]?.tags, "des: Studio,flat");
});

test("parseMymindCsv rejects a CSV without the mymind columns", () => {
  assert.equal(parseMymindCsv("name,link\nfoo,https://x.test\n"), null);
  assert.equal(parseMymindCsv(""), null);
});

test("splitMymindTags trims, drops blanks, and de-dupes case-insensitively", () => {
  assert.deepEqual(splitMymindTags(" design,Design, ,typography,\nweb  design,"), ["design", "typography", "web design"]);
});

test("splitPrefixedTag splits namespaced tags only", () => {
  assert.deepEqual(splitPrefixedTag("des: Socially Savvy Studio"), {
    parent: "des",
    child: "Socially Savvy Studio",
  });
  assert.equal(splitPrefixedTag("https://example.com"), null);
  assert.equal(splitPrefixedTag("Industry / Publishing"), null);
  assert.equal(splitPrefixedTag("note to self: later"), null);
});

test("mymindCardTitle falls back to content, then URL, then type", () => {
  assert.equal(mymindCardTitle(row({
    content: "\n\"Design is thinking ahead.\"\n\nmore",
  })), "Design is thinking ahead.");
  assert.equal(mymindCardTitle(row({
    url: "https://www.example.com/a/b",
  })), "example.com/a/b");
  assert.equal(mymindCardTitle(row({
    type: "Video",
  })), "Untitled Video");
});

test("buildMymindImportCards merges cards sharing a URL, preferring the page card's title", () => {
  const url = "https://brand.test/met";
  const plan = buildMymindImportCards([
    row({
      id: "1",
      type: "Image",
      title: "Hello Sign",
      url,
      tags: "design,typography",
      created: "2025-02-08T19:04:17Z",
    }),
    row({
      id: "2",
      type: "Article",
      title: "New Met identity",
      url,
      note: "great read",
      tags: "Design,museum",
      created: "2025-02-08T19:03:00Z",
    }),
    row({
      id: "3",
      type: "Note",
      content: "A quote",
    }),
  ], {
    includeUrlless: true,
  });
  assert.equal(plan.cards.length, 2);
  assert.equal(plan.mergedCount, 1);
  const merged = plan.cards[0]!;
  assert.deepEqual(merged.mymindIds, ["1", "2"]);
  assert.equal(merged.title, "New Met identity");
  assert.equal(merged.type, "Article");
  assert.deepEqual(merged.tags, ["design", "typography", "museum"]);
  assert.equal(merged.createdAt, "2025-02-08T19:03:00Z");
  assert.equal(merged.description, "great read\n\nAlso saved from this page:\n- Hello Sign");
  assert.equal(plan.cards[1]!.url, null);
  assert.equal(plan.cards[1]!.description, "A quote");
});

test("buildMymindImportCards skips URL-less cards when asked", () => {
  const plan = buildMymindImportCards([row({
    id: "1",
  }), row({
    id: "2",
    url: "https://x.test",
  })], {
    includeUrlless: false,
  });
  assert.equal(plan.cards.length, 1);
  assert.equal(plan.skippedUrlless, 1);
});

test("mymindTypeMediaTypeCandidates includes spaced form and aliases", () => {
  assert.deepEqual(mymindTypeMediaTypeCandidates("WebPage"), ["WebPage", "Web Page", "Website", "Website/App"]);
  assert.ok(mymindTypeMediaTypeCandidates("YouTubeVideo").includes("Video"));
  assert.deepEqual(mymindTypeMediaTypeCandidates(""), []);
});

test("mymindTagStats counts distinct tags and prefix groups", () => {
  const plan = buildMymindImportCards([row({
    id: "1",
    url: "https://a.test",
    tags: "des: A,des: B,org: X,flat",
  }), row({
    id: "2",
    url: "https://b.test",
    tags: "Des: a,flat,modern",
  })], {
    includeUrlless: true,
  });
  assert.deepEqual(mymindTagStats(plan.cards), {
    tagCount: 5,
    prefixGroups: [{
      prefix: "des",
      valueCount: 2,
    }, {
      prefix: "org",
      valueCount: 1,
    }],
  });
});
