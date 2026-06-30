import assert from "node:assert/strict";
import { test } from "node:test";

import {
  extractArticleImageCandidates,
  filterCandidates,
  matchesImageBlacklist,
} from "@/services/imageCandidates";

const PAGE = "https://example.com/article";

test("extractArticleImageCandidates pulls og + twitter + JSON-LD images", () => {
  const html = `
    <head>
      <meta property="og:image" content="https://cdn.example.com/og.jpg">
      <meta name="twitter:image" content="https://cdn.example.com/tw.jpg">
      <script type="application/ld+json">
        {"@type":"Article","image":["https://cdn.example.com/ld1.jpg",{"url":"https://cdn.example.com/ld2.jpg"}]}
      </script>
    </head>`;
  const urls = extractArticleImageCandidates(html, PAGE).map(c => c.url);
  assert.ok(urls.includes("https://cdn.example.com/og.jpg"));
  assert.ok(urls.includes("https://cdn.example.com/tw.jpg"));
  assert.ok(urls.includes("https://cdn.example.com/ld1.jpg"));
  assert.ok(urls.includes("https://cdn.example.com/ld2.jpg"));
});

test("extractArticleImageCandidates scopes <img> to the article and skips nav/footer/ads", () => {
  const html = `
    <body>
      <header><img src="https://cdn.example.com/logo.png" width="300" height="300"></header>
      <nav><img src="https://cdn.example.com/navbanner.jpg" width="900" height="250"></nav>
      <article>
        <img src="https://cdn.example.com/hero.jpg" width="1200" height="800">
        <img src="https://ads.doubleclick.net/banner.jpg" width="728" height="90">
        <img src="https://cdn.example.com/spacer.gif" width="1" height="1">
        <figure><img src="/relative/inline.jpg"></figure>
      </article>
      <footer><img src="https://cdn.example.com/footer.jpg" width="600" height="400"></footer>
    </body>`;
  const urls = extractArticleImageCandidates(html, PAGE).map(c => c.url);
  assert.ok(urls.includes("https://cdn.example.com/hero.jpg"), "keeps the article hero");
  assert.ok(urls.includes("https://example.com/relative/inline.jpg"), "resolves relative URLs");
  assert.ok(!urls.includes("https://cdn.example.com/logo.png"), "drops header logo");
  assert.ok(!urls.includes("https://cdn.example.com/navbanner.jpg"), "drops nav banner");
  assert.ok(!urls.includes("https://cdn.example.com/footer.jpg"), "drops footer image");
  assert.ok(!urls.some(u => u.includes("doubleclick")), "drops ad-pattern images");
  assert.ok(!urls.some(u => u.includes("spacer")), "drops tiny spacer images");
});

test("extractArticleImageCandidates picks the largest srcset entry", () => {
  const html = `
    <main>
      <img srcset="https://cdn.example.com/small.jpg 480w, https://cdn.example.com/large.jpg 1600w">
    </main>`;
  const urls = extractArticleImageCandidates(html, PAGE).map(c => c.url);
  assert.ok(urls.includes("https://cdn.example.com/large.jpg"));
  assert.ok(!urls.includes("https://cdn.example.com/small.jpg"));
});

test("extractArticleImageCandidates does not scrape <img> without an article region", () => {
  const html = "<body><div><img src=\"https://cdn.example.com/loose.jpg\" width=\"800\" height=\"600\"></div></body>";
  const urls = extractArticleImageCandidates(html, PAGE).map(c => c.url);
  assert.deepEqual(urls, []);
});

test("matchesImageBlacklist matches case-insensitive substrings and globs", () => {
  assert.equal(matchesImageBlacklist("https://ADS.doubleclick.net/x.jpg", ["doubleclick"]), true);
  assert.equal(matchesImageBlacklist("https://cdn.example.com/x.jpg", ["doubleclick"]), false);
  assert.equal(matchesImageBlacklist("https://x.com/ads/banner.jpg", ["*/ads/*"]), true);
  assert.equal(matchesImageBlacklist("https://x.com/content/banner.jpg", ["*/ads/*"]), false);
  assert.equal(matchesImageBlacklist("https://x.com/a.jpg", ["   "]), false);
});

test("filterCandidates drops private hosts, blacklisted, and duplicate URLs", () => {
  const candidates = [
    {
      url: "https://cdn.example.com/a.jpg",
      source: "og" as const,
    },
    {
      url: "https://cdn.example.com/a.jpg",
      source: "article" as const,
    }, // duplicate
    {
      url: "http://127.0.0.1/secret.jpg",
      source: "article" as const,
    }, // SSRF
    {
      url: "https://ads.doubleclick.net/x.jpg",
      source: "article" as const,
    }, // blacklisted
    {
      url: "https://cdn.example.com/b.jpg",
      source: "twitter" as const,
    },
  ];
  const result = filterCandidates(candidates, ["doubleclick"]);
  assert.deepEqual(result.map(c => c.url), [
    "https://cdn.example.com/a.jpg",
    "https://cdn.example.com/b.jpg",
  ]);
});
