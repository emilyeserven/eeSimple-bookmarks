import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractCandidates,
  extractEmlHtml,
  extractHtmlCandidates,
  extractTextCandidates,
  filterAndDedupe,
  isJunkLink,
  type LinkCandidate,
} from "@/services/newsletterIngest";

// Pure extraction tests — no network or database, matching the metadata-parser test style.

test("extractHtmlCandidates pulls href + anchor text, decoding entities and stripping inner tags", () => {
  const html
    = "<a href=\"https://example.com/a\">First <span>article</span> &amp; more</a>"
      + "<a href='https://example.com/b'><img src=\"x.png\">  Second  </a>";
  const result = extractHtmlCandidates(html);
  assert.deepEqual(result, [
    {
      rawUrl: "https://example.com/a",
      anchorText: "First article & more",
      source: "html-anchor",
    },
    {
      rawUrl: "https://example.com/b",
      anchorText: "Second",
      source: "html-anchor",
    },
  ]);
});

test("extractHtmlCandidates skips mailto / tel / # / javascript and relative hrefs", () => {
  const html
    = "<a href=\"mailto:x@y.com\">mail</a>"
      + "<a href=\"tel:+15551234\">call</a>"
      + "<a href=\"#section\">jump</a>"
      + "<a href=\"javascript:void(0)\">js</a>"
      + "<a href=\"/relative/path\">rel</a>"
      + "<a href=\"https://example.com/keep\">keep</a>";
  assert.deepEqual(extractHtmlCandidates(html).map(c => c.rawUrl), ["https://example.com/keep"]);
});

test("extractTextCandidates finds bare URLs and trims trailing punctuation", () => {
  const text = "Read https://example.com/a, then visit https://example.com/b). No link here.";
  assert.deepEqual(extractTextCandidates(text).map(c => c.rawUrl), [
    "https://example.com/a",
    "https://example.com/b",
  ]);
  assert.deepEqual(extractTextCandidates("nothing to see"), []);
});

test("extractCandidates sniffs html vs plain text in auto mode", () => {
  assert.equal(extractCandidates("<a href=\"https://x.com/1\">x</a>", "auto").length, 1);
  assert.equal(extractCandidates("see https://x.com/1 for more", "auto")[0]?.source, "plain-text");
});

test("extractCandidates in html mode also catches bare URLs in visible text, not in attributes", () => {
  const html
    = "<p><a href=\"https://example.com/a\">Article A</a></p>"
      + "<p>Also worth a read: https://example.com/b</p>";
  const result = extractCandidates(html, "html");
  // Anchor + bare-text URL both found (the href URL isn't double-listed as a separate text match).
  assert.deepEqual(result.map(c => c.rawUrl).sort(), [
    "https://example.com/a",
    "https://example.com/b",
  ]);
  // After dedupe the anchor keeps its title and the bare URL stays anchor-less.
  const deduped = filterAndDedupe(result);
  assert.equal(deduped.find(c => c.rawUrl === "https://example.com/a")?.anchorText, "Article A");
  assert.equal(deduped.find(c => c.rawUrl === "https://example.com/b")?.anchorText, "");
});

test("isJunkLink drops chrome: unsubscribe, tracking pixels, and empty-anchor social buttons", () => {
  const junk: LinkCandidate[] = [
    {
      rawUrl: "https://news.example.com/unsubscribe?u=1",
      anchorText: "Unsubscribe",
      source: "html-anchor",
    },
    {
      rawUrl: "https://t.example.com/open.gif?id=1",
      anchorText: "",
      source: "html-anchor",
    },
    {
      rawUrl: "https://twitter.com/intent/tweet",
      anchorText: "Share",
      source: "html-anchor",
    },
    {
      rawUrl: "https://example.com/account/manage",
      anchorText: "Manage preferences",
      source: "html-anchor",
    },
  ];
  for (const candidate of junk) assert.equal(isJunkLink(candidate), true, candidate.rawUrl);
});

test("isJunkLink keeps real articles, including a titled link to a social post", () => {
  const keep: LinkCandidate[] = [
    {
      rawUrl: "https://blog.example.com/great-post",
      anchorText: "A great post",
      source: "html-anchor",
    },
    {
      rawUrl: "https://twitter.com/user/status/123",
      anchorText: "Thread on AI safety",
      source: "html-anchor",
    },
  ];
  for (const candidate of keep) assert.equal(isJunkLink(candidate), false, candidate.rawUrl);
});

test("filterAndDedupe collapses same host+path and keeps the richer anchor text", () => {
  const result = filterAndDedupe([
    {
      rawUrl: "https://example.com/post?utm_source=a",
      anchorText: "",
      source: "html-anchor",
    },
    {
      rawUrl: "https://example.com/post?utm_source=b",
      anchorText: "The full title",
      source: "html-anchor",
    },
    {
      rawUrl: "https://news.example.com/unsubscribe",
      anchorText: "Unsubscribe",
      source: "html-anchor",
    },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.anchorText, "The full title");
});

test("extractEmlHtml decodes a quoted-printable text/html part from multipart/alternative", () => {
  const eml = [
    "Content-Type: multipart/alternative; boundary=\"BOUND\"",
    "",
    "--BOUND",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "plain body",
    "--BOUND",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "<a href=3D\"https://example.com/a\">Caf=C3=A9</a>",
    "--BOUND--",
    "",
  ].join("\r\n");
  const {
    html,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.ok(html);
  assert.match(html, /href="https:\/\/example\.com\/a"/);
  assert.match(html, /Café/);
});

test("extractEmlHtml decodes a base64 text/html part", () => {
  const body = Buffer.from("<a href=\"https://example.com/b\">B</a>", "utf8").toString("base64");
  const eml = [
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
    "",
  ].join("\r\n");
  const {
    html,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.ok(html);
  assert.match(html, /href="https:\/\/example\.com\/b"/);
});

test("extractEmlHtml returns text when there is no html part", () => {
  const eml = ["Content-Type: text/plain; charset=utf-8", "", "just text https://example.com/c", ""].join("\r\n");
  const {
    html, text,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.equal(html, null);
  assert.match(text ?? "", /https:\/\/example\.com\/c/);
});
