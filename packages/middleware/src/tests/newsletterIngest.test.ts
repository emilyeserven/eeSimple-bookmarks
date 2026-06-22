import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeMimeWords,
  extractCandidates,
  extractEmlHtml,
  extractHtmlCandidates,
  extractTextCandidates,
  filterAndDedupe,
  isJunkLink,
  type LinkCandidate,
  linkContextFrom,
} from "@/services/newsletterIngest";

// Pure extraction tests — no network or database, matching the metadata-parser test style.

/** Compare candidates on the link-identity fields, ignoring the best-effort `context` blurb. */
function identity(candidates: LinkCandidate[]): Omit<LinkCandidate, "context">[] {
  return candidates.map(({
    rawUrl, anchorText, source,
  }) => ({
    rawUrl,
    anchorText,
    source,
  }));
}

test("extractHtmlCandidates pulls href + anchor text, decoding entities and stripping inner tags", () => {
  const html
    = "<a href=\"https://example.com/a\">First <span>article</span> &amp; more</a>"
      + "<a href='https://example.com/b'><img src=\"x.png\">  Second  </a>";
  assert.deepEqual(identity(extractHtmlCandidates(html)), [
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

test("extractHtmlCandidates captures the surrounding heading + paragraph as context", () => {
  const html = "<h3>Editor's Picks</h3><p>Don't miss <a href=\"https://example.com/x\">the post</a> this week.</p>";
  const [candidate] = extractHtmlCandidates(html);
  assert.ok(candidate);
  assert.match(candidate.context ?? "", /Editor's Picks/);
  assert.match(candidate.context ?? "", /Don't miss the post this week\./);
});

test("linkContextFrom returns heading + paragraph, or null when there is no surrounding text", () => {
  const html = "<h2>Top Stories</h2><p>Check out <a href=\"https://example.com/a\">this article</a> today.</p>";
  const start = html.indexOf("<a");
  const end = html.indexOf("</a>") + "</a>".length;
  assert.equal(linkContextFrom(html, start, end), "Top Stories\n\nCheck out this article today.");

  // A bare anchor with no heading and no surrounding prose yields no usable context.
  const bare = "<a href=\"https://example.com/a\"></a>";
  assert.equal(linkContextFrom(bare, 0, bare.length), null);
});

test("extractTextCandidates finds bare URLs and trims trailing punctuation", () => {
  const text = "Read https://example.com/a, then visit https://example.com/b). No link here.";
  assert.deepEqual(extractTextCandidates(text).map(c => c.rawUrl), [
    "https://example.com/a",
    "https://example.com/b",
  ]);
  assert.deepEqual(extractTextCandidates("nothing to see"), []);
});

test("extractTextCandidates never attaches context (plain text has no structure)", () => {
  assert.equal(extractTextCandidates("see https://example.com/a")[0]?.context, null);
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
      context: null,
    },
    {
      rawUrl: "https://t.example.com/open.gif?id=1",
      anchorText: "",
      source: "html-anchor",
      context: null,
    },
    {
      rawUrl: "https://twitter.com/intent/tweet",
      anchorText: "Share",
      source: "html-anchor",
      context: null,
    },
    {
      rawUrl: "https://example.com/account/manage",
      anchorText: "Manage preferences",
      source: "html-anchor",
      context: null,
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
      context: null,
    },
    {
      rawUrl: "https://twitter.com/user/status/123",
      anchorText: "Thread on AI safety",
      source: "html-anchor",
      context: null,
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
      context: null,
    },
    {
      rawUrl: "https://example.com/post?utm_source=b",
      anchorText: "The full title",
      source: "html-anchor",
      context: null,
    },
    {
      rawUrl: "https://news.example.com/unsubscribe",
      anchorText: "Unsubscribe",
      source: "html-anchor",
      context: null,
    },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.anchorText, "The full title");
});

test("filterAndDedupe keeps the richer anchor text AND a non-null context across duplicates", () => {
  const result = filterAndDedupe([
    {
      rawUrl: "https://example.com/post?a=1",
      anchorText: "",
      source: "html-anchor",
      context: "Heading\n\nFrom the intro paragraph.",
    },
    {
      rawUrl: "https://example.com/post?a=2",
      anchorText: "The full title",
      source: "html-anchor",
      context: null,
    },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.anchorText, "The full title");
  assert.equal(result[0]?.context, "Heading\n\nFrom the intro paragraph.");
});

test("decodeMimeWords decodes B/Q encoded-words and passes plain text through", () => {
  assert.equal(decodeMimeWords("Weekly Roundup"), "Weekly Roundup");
  assert.equal(decodeMimeWords("=?utf-8?Q?Caf=C3=A9_Roundup?="), "Café Roundup");
  const base64 = Buffer.from("Café", "utf8").toString("base64");
  assert.equal(decodeMimeWords(`=?utf-8?B?${base64}?=`), "Café");
});

test("extractEmlHtml decodes a quoted-printable text/html part from multipart/alternative", () => {
  const eml = [
    "Subject: Weekly Roundup",
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
    html, subject,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.ok(html);
  assert.match(html, /href="https:\/\/example\.com\/a"/);
  assert.match(html, /Café/);
  assert.equal(subject, "Weekly Roundup");
});

test("extractEmlHtml decodes an RFC 2047 encoded Subject", () => {
  const eml = [
    "Subject: =?utf-8?Q?Caf=C3=A9_Digest?=",
    "Content-Type: text/html; charset=utf-8",
    "",
    "<a href=\"https://example.com/b\">B</a>",
    "",
  ].join("\r\n");
  assert.equal(extractEmlHtml(Buffer.from(eml, "utf8")).subject, "Café Digest");
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
    html, subject,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.ok(html);
  assert.match(html, /href="https:\/\/example\.com\/b"/);
  // No Subject header → null.
  assert.equal(subject, null);
});

test("extractEmlHtml returns text when there is no html part", () => {
  const eml = ["Content-Type: text/plain; charset=utf-8", "", "just text https://example.com/c", ""].join("\r\n");
  const {
    html, text,
  } = extractEmlHtml(Buffer.from(eml, "utf8"));
  assert.equal(html, null);
  assert.match(text ?? "", /https:\/\/example\.com\/c/);
});
