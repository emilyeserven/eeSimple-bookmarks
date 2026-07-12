// Side-effect imports: the classic extension scripts assign `globalThis.eesimpleFillEngine` /
// `globalThis.eesimpleTaxonomyFill`.
import "../../public/extension/fillEngine.js";
import "../../public/extension/taxonomyFill.js";

import type { TaxonomyEntityAssociationSpec } from "@eesimple/types";

import { TAXONOMY_ENTITY_SPECS } from "@eesimple/types";
import { describe, expect, it, vi } from "vitest";

interface FillResult {
  ruleId: string;
  values: string[];
  error?: string;
}

interface FillEngine {
  runRules(rules: unknown[], doc?: Document): FillResult[];
}

const engine = (globalThis as unknown as { eesimpleFillEngine: FillEngine }).eesimpleFillEngine;

/** Parse fixture HTML into an isolated document (also exercises the `doc` parameter). */
function docFrom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/** Run a single rule against a fixture and return its result. */
function runOne(rule: unknown, html: string): FillResult {
  return engine.runRules([rule], docFrom(html))[0];
}

// A realistic O'Reilly stats-block snippet: three blocks sharing `_statBlockTitle_1ckth_86`, each a
// label span + value span. The PRINT LENGTH rule must narrow to the one block via its sibling text.
const OREILLY_STATS_HTML = `
  <div class="_statBlock_1ckth_70">
    <div class="_statBlockTitle_1ckth_86">
      <span>PRINT LENGTH:</span>
      <span>336 pages</span>
    </div>
  </div>
  <div class="_statBlock_1ckth_70">
    <div class="_statBlockTitle_1ckth_86">
      <span>PUBLISHER:</span>
      <span>Manning</span>
    </div>
  </div>
  <div class="_statBlock_1ckth_70">
    <div class="_statBlockTitle_1ckth_86">
      <span>RELEASE DATE:</span>
      <span>March 2024</span>
    </div>
  </div>
`;

describe("eesimpleFillEngine.runRules — PRINT LENGTH worked example (#1239)", () => {
  it("extracts the page count from the O'Reilly stats block", () => {
    const rule = {
      id: "pages",
      extract: {
        selector: "._statBlockTitle_1ckth_86 > *",
        filters: [{
          kind: "siblingText",
          match: {
            mode: "contains",
            value: "PRINT LENGTH:",
          },
        }],
        transform: [{
          kind: "number",
        }],
      },
    };
    expect(runOne(rule, OREILLY_STATS_HTML)).toEqual({
      ruleId: "pages",
      values: ["336"],
    });
  });
});

describe("eesimpleFillEngine.runRules — filters", () => {
  const LIST_HTML = `
    <ul>
      <li class="item">Learn Docker</li>
      <li class="item">Kubernetes Up and Running</li>
      <li class="item">Docker Deep Dive</li>
    </ul>
  `;

  it("selfText — passing keeps matching candidates", () => {
    const rule = {
      id: "self",
      extract: {
        selector: ".item",
        filters: [{
          kind: "selfText",
          match: {
            mode: "contains",
            value: "Docker",
          },
        }],
      },
    };
    expect(runOne(rule, LIST_HTML).values).toEqual(["Learn Docker", "Docker Deep Dive"]);
  });

  it("selfText — non-matching narrows to empty", () => {
    const rule = {
      id: "self",
      extract: {
        selector: ".item",
        filters: [{
          kind: "selfText",
          match: {
            mode: "equals",
            value: "Nonexistent",
          },
        }],
      },
    };
    expect(runOne(rule, LIST_HTML).values).toEqual([]);
  });

  it("siblingText — non-matching narrows to empty", () => {
    const rule = {
      id: "sib",
      extract: {
        selector: "._statBlockTitle_1ckth_86 > *",
        filters: [{
          kind: "siblingText",
          match: {
            mode: "contains",
            value: "NONEXISTENT LABEL:",
          },
        }],
      },
    };
    expect(runOne(rule, OREILLY_STATS_HTML).values).toEqual([]);
  });

  const ANCESTOR_HTML = `
    <div class="block">
      <div class="header">METADATA</div>
      <div class="body"><span class="leaf">Ada</span></div>
    </div>
  `;

  it("ancestorText — passing keeps candidate when an ancestor within maxDepth matches", () => {
    const rule = {
      id: "anc",
      extract: {
        selector: ".leaf",
        filters: [{
          kind: "ancestorText",
          match: {
            mode: "contains",
            value: "METADATA",
          },
          maxDepth: 2,
        }],
      },
    };
    expect(runOne(rule, ANCESTOR_HTML).values).toEqual(["Ada"]);
  });

  it("ancestorText — non-matching when the match lies beyond maxDepth", () => {
    const rule = {
      id: "anc",
      extract: {
        selector: ".leaf",
        filters: [{
          kind: "ancestorText",
          match: {
            mode: "contains",
            value: "METADATA",
          },
          maxDepth: 1,
        }],
      },
    };
    expect(runOne(rule, ANCESTOR_HTML).values).toEqual([]);
  });

  const CARDS_HTML = `
    <div class="card" data-id="c1"><span class="price">$10</span></div>
    <div class="card" data-id="c2"><span class="price">$20</span></div>
  `;

  it("closest — maps candidates to the nearest matching ancestor (read the container's attr)", () => {
    const rule = {
      id: "closest",
      extract: {
        selector: ".price",
        filters: [{
          kind: "closest",
          selector: ".card",
        }],
        read: {
          kind: "attr",
          name: "data-id",
        },
      },
    };
    expect(runOne(rule, CARDS_HTML).values).toEqual(["c1", "c2"]);
  });

  it("closest — non-matching ancestor selector maps to empty", () => {
    const rule = {
      id: "closest",
      extract: {
        selector: ".price",
        filters: [{
          kind: "closest",
          selector: ".no-such-ancestor",
        }],
      },
    };
    expect(runOne(rule, CARDS_HTML).values).toEqual([]);
  });

  it("nth — passing selects the candidate at the index (and negative indexes from the end)", () => {
    const second = {
      id: "nth",
      extract: {
        selector: ".item",
        filters: [{
          kind: "nth",
          index: 1,
        }],
      },
    };
    const last = {
      id: "nth",
      extract: {
        selector: ".item",
        filters: [{
          kind: "nth",
          index: -1,
        }],
      },
    };
    expect(runOne(second, LIST_HTML).values).toEqual(["Kubernetes Up and Running"]);
    expect(runOne(last, LIST_HTML).values).toEqual(["Docker Deep Dive"]);
  });

  it("nth — out-of-range index narrows to empty", () => {
    const rule = {
      id: "nth",
      extract: {
        selector: ".item",
        filters: [{
          kind: "nth",
          index: 5,
        }],
      },
    };
    expect(runOne(rule, LIST_HTML).values).toEqual([]);
  });
});

describe("eesimpleFillEngine.runRules — read", () => {
  const HTML = "<a class=\"link\" href=\"https://example.com\" data-isbn=\"9781633438460\">Learn Docker</a>";

  it("attr — passing reads the attribute value", () => {
    const rule = {
      id: "isbn",
      extract: {
        selector: ".link",
        read: {
          kind: "attr",
          name: "data-isbn",
        },
      },
    };
    expect(runOne(rule, HTML).values).toEqual(["9781633438460"]);
  });

  it("attr — a missing attribute drops the candidate (empty, not error)", () => {
    const rule = {
      id: "isbn",
      extract: {
        selector: ".link",
        read: {
          kind: "attr",
          name: "data-missing",
        },
      },
    };
    expect(runOne(rule, HTML)).toEqual({
      ruleId: "isbn",
      values: [],
    });
  });

  it("text — default read uses trimmed textContent", () => {
    const rule = {
      id: "title",
      extract: {
        selector: ".link",
      },
    };
    expect(runOne(rule, HTML).values).toEqual(["Learn Docker"]);
  });

  it("backgroundImage — pulls the url out of an inline background-image style", () => {
    const html = "<div class=\"poster\" style=\"background-image: url('https://cdn.example.com/cover.jpg')\"></div>";
    const rule = {
      id: "poster",
      extract: {
        selector: ".poster",
        read: {
          kind: "backgroundImage",
        },
      },
    };
    expect(runOne(rule, html).values).toEqual(["https://cdn.example.com/cover.jpg"]);
  });

  it("backgroundImage — takes the first layer and handles an unquoted url", () => {
    const html = "<div class=\"poster\" style=\"background-image: url(https://cdn.example.com/a.png), url(b.png)\"></div>";
    const rule = {
      id: "poster",
      extract: {
        selector: ".poster",
        read: {
          kind: "backgroundImage",
        },
      },
    };
    expect(runOne(rule, html).values).toEqual(["https://cdn.example.com/a.png"]);
  });

  it("backgroundImage — no background image drops the candidate (empty, not error)", () => {
    const html = "<div class=\"poster\"></div>";
    const rule = {
      id: "poster",
      extract: {
        selector: ".poster",
        read: {
          kind: "backgroundImage",
        },
      },
    };
    expect(runOne(rule, html)).toEqual({
      ruleId: "poster",
      values: [],
    });
  });

  // A hero header often paints its artwork on a `::before` pseudo-element (so a gradient overlay can
  // sit on top). That background can't be reached with a CSS selector, so the reader falls through to
  // the element's pseudo-elements when the element itself has none. jsdom doesn't compute
  // stylesheet-driven pseudo backgrounds, so stub `getComputedStyle` to exercise the branch.
  it("backgroundImage — falls through to a ::before pseudo-element background", () => {
    const el = document.createElement("div");
    el.className = "hero";
    document.body.appendChild(el);
    const realGetComputedStyle = window.getComputedStyle.bind(window);
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation(((element: Element, pseudo?: string | null) => {
        if (element === el) {
          const backgroundImage = pseudo === "::before"
            ? "url(\"https://cdn.example.com/hero.jpg\")"
            : "none";
          return {
            backgroundImage,
          } as CSSStyleDeclaration;
        }
        return realGetComputedStyle(element);
      }) as typeof window.getComputedStyle);
    try {
      const res = engine.runRules([{
        id: "hero",
        extract: {
          selector: ".hero",
          read: {
            kind: "backgroundImage",
          },
        },
      }], document);
      expect(res[0]).toEqual({
        ruleId: "hero",
        values: ["https://cdn.example.com/hero.jpg"],
      });
    }
    finally {
      spy.mockRestore();
      el.remove();
    }
  });
});

describe("eesimpleFillEngine.runRules — transforms", () => {
  const html = (text: string) => `<span class="v">${text}</span>`;
  const withTransforms = (transform: unknown[]) => ({
    id: "t",
    extract: {
      selector: ".v",
      transform,
    },
  });

  it("regex — passing extracts the capture group", () => {
    const rule = withTransforms([{
      kind: "regex",
      pattern: "ISBN:\\s*([\\d-]+)",
      group: 1,
    }]);
    expect(runOne(rule, html("ISBN: 978-1-234")).values).toEqual(["978-1-234"]);
  });

  it("regex — non-matching pattern yields no value", () => {
    const rule = withTransforms([{
      kind: "regex",
      pattern: "NOPE(\\d+)",
      group: 1,
    }]);
    expect(runOne(rule, html("ISBN: 978-1-234")).values).toEqual([]);
  });

  it("number — passing takes the first numeric run with commas stripped", () => {
    expect(runOne(withTransforms([{
      kind: "number",
    }]), html("336 pages")).values).toEqual(["336"]);
    expect(runOne(withTransforms([{
      kind: "number",
    }]), html("1,234 reviews")).values).toEqual(["1234"]);
  });

  it("number — non-matching (no digits) yields no value", () => {
    expect(runOne(withTransforms([{
      kind: "number",
    }]), html("no digits here")).values).toEqual([]);
  });

  it("duration — sums each unit into total seconds (77h 32m → 279120)", () => {
    const dur = withTransforms([{
      kind: "duration",
    }]);
    expect(runOne(dur, html("77h 32m")).values).toEqual(["279120"]);
    expect(runOne(dur, html("77 hours and 32 minutes")).values).toEqual(["279120"]);
    expect(runOne(dur, html("1h30m")).values).toEqual(["5400"]);
    expect(runOne(dur, html("90m")).values).toEqual(["5400"]);
    expect(runOne(dur, html("1.5h")).values).toEqual(["5400"]);
  });

  it("duration — parses years/months and over-range components", () => {
    const dur = withTransforms([{
      kind: "duration",
    }]);
    // "mo" is months, "m" is minutes — 1y 2mo 6d 23h 34m 34s.
    expect(runOne(dur, html("1y 2mo 6d 23h 34m 34s")).values).toEqual(["37323274"]);
    // Over-range components simply sum (93m, 93s).
    expect(runOne(dur, html("1y 23mo 343d 90h 93m 93s")).values).toEqual(["121116873"]);
  });

  it("duration — no unit tokens yields no value", () => {
    expect(runOne(withTransforms([{
      kind: "duration",
    }]), html("no duration here")).values).toEqual([]);
  });

  it("replace — passing rewrites the matched substring", () => {
    const rule = withTransforms([{
      kind: "replace",
      pattern: "World",
      replacement: "There",
    }]);
    expect(runOne(rule, html("Hello World")).values).toEqual(["Hello There"]);
  });

  it("replace — non-matching pattern leaves the value unchanged", () => {
    const rule = withTransforms([{
      kind: "replace",
      pattern: "xyz",
      replacement: "!",
    }]);
    expect(runOne(rule, html("Hello World")).values).toEqual(["Hello World"]);
  });

  it("trim — passing strips mid-pipeline whitespace so a following anchored regex matches", () => {
    // An earlier replace pads the value; trim removes it so the anchored `^(\d+)$` regex matches.
    const rule = withTransforms([
      {
        kind: "replace",
        pattern: "^(.*)$",
        replacement: "  $1  ",
      },
      {
        kind: "trim",
      },
      {
        kind: "regex",
        pattern: "^(\\d+)$",
        group: 1,
      },
    ]);
    expect(runOne(rule, html("336")).values).toEqual(["336"]);
  });

  it("trim — its absence leaves the padded value failing the anchored regex (no value)", () => {
    const rule = withTransforms([
      {
        kind: "replace",
        pattern: "^(.*)$",
        replacement: "  $1  ",
      },
      {
        kind: "regex",
        pattern: "^(\\d+)$",
        group: 1,
      },
    ]);
    expect(runOne(rule, html("336")).values).toEqual([]);
  });

  it("affix — prepends prefix and appends suffix around the value", () => {
    const rule = withTransforms([{
      kind: "affix",
      prefix: "https://x.com",
      suffix: "?ref=1",
    }]);
    expect(runOne(rule, html("/books/1")).values).toEqual(["https://x.com/books/1?ref=1"]);
  });

  it("absoluteUrl — resolves a relative href against the page's base URL", () => {
    const doc = docFrom(
      "<head><base href=\"https://x.com/list/page\"></head><body><span class=\"v\">/books/1</span></body>",
    );
    const rule = withTransforms([{
      kind: "absoluteUrl",
    }]);
    expect(engine.runRules([rule], doc)[0].values).toEqual(["https://x.com/books/1"]);
  });
});

describe("eesimpleFillEngine.runRules — split & multi-value", () => {
  const HTML = "<div class=\"creators\">Ada Lovelace, Alan Turing, Ada Lovelace</div>";

  it("split — one value becomes many, trimmed and de-duplicated", () => {
    const rule = {
      id: "people",
      extract: {
        selector: ".creators",
        split: ",",
      },
    };
    expect(runOne(rule, HTML).values).toEqual(["Ada Lovelace", "Alan Turing"]);
  });

  it("no split — a single value stays single", () => {
    const rule = {
      id: "people",
      extract: {
        selector: ".creators",
      },
    };
    expect(runOne(rule, "<div class=\"creators\">Solo Author</div>").values).toEqual(["Solo Author"]);
  });
});

describe("eesimpleFillEngine.runRules — errors & isolation", () => {
  it("invalid selector yields a per-rule error, never a throw", () => {
    const rule = {
      id: "bad-sel",
      extract: {
        selector: "((",
      },
    };
    const result = runOne(rule, "<div></div>");
    expect(result.ruleId).toBe("bad-sel");
    expect(result.values).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("invalid transform regex yields a per-rule error", () => {
    const rule = {
      id: "bad-re",
      extract: {
        selector: ".v",
        transform: [{
          kind: "regex",
          pattern: "(",
        }],
      },
    };
    const result = runOne(rule, "<span class=\"v\">hi</span>");
    expect(result.values).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("invalid TextMatch regex yields a per-rule error", () => {
    const rule = {
      id: "bad-match",
      extract: {
        selector: ".v",
        filters: [{
          kind: "selfText",
          match: {
            mode: "regex",
            value: "(",
          },
        }],
      },
    };
    const result = runOne(rule, "<span class=\"v\">hi</span>");
    expect(result.values).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("one bad rule never poisons the batch — the others still run", () => {
    const good1 = {
      id: "g1",
      extract: {
        selector: ".v",
      },
    };
    const bad = {
      id: "bad",
      extract: {
        selector: "((",
      },
    };
    const good2 = {
      id: "g2",
      extract: {
        selector: ".w",
      },
    };
    const results = engine.runRules(
      [good1, bad, good2],
      docFrom("<span class=\"v\">one</span><span class=\"w\">two</span>"),
    );
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      ruleId: "g1",
      values: ["one"],
    });
    expect(results[1].error).toBeTruthy();
    expect(results[1].values).toEqual([]);
    expect(results[2]).toEqual({
      ruleId: "g2",
      values: ["two"],
    });
  });

  it("no candidates matched is an empty result, not an error", () => {
    const rule = {
      id: "none",
      extract: {
        selector: ".nothing-here",
      },
    };
    expect(runOne(rule, "<div></div>")).toEqual({
      ruleId: "none",
      values: [],
    });
  });
});

describe("eesimpleFillEngine.runRules — default document", () => {
  it("falls back to the ambient document when no doc is passed", () => {
    document.body.innerHTML = "<h1 class=\"page-title\">Ambient Title</h1>";
    const rule = {
      id: "title",
      extract: {
        selector: ".page-title",
      },
    };
    expect(engine.runRules([rule])).toEqual([{
      ruleId: "title",
      values: ["Ambient Title"],
    }]);
    document.body.innerHTML = "";
  });
});

describe("eesimpleFillEngine.runRules — meta-tag source (#extension-fill-meta)", () => {
  const META_HTML = `
    <head>
      <meta name="twitter:creator" content="@OReillyMedia">
      <meta property="og:book:author" itemprop="author" content="Colin O'Flynn">
      <meta property="og:book:author" content="Jasper van Woudenberg">
      <meta name="citation_publication_date" content="June 21, 2026">
    </head>
  `;

  it("reads a meta tag matched by `name`, defaulting the read to `content`", () => {
    const rule = {
      id: "creator",
      extract: {
        source: "meta",
        metaKey: "twitter:creator",
      },
    };
    expect(runOne(rule, META_HTML).values).toEqual(["@OReillyMedia"]);
  });

  it("matches by `property` (or `itemprop`) and collects every matching meta tag", () => {
    const rule = {
      id: "authors",
      extract: {
        source: "meta",
        metaKey: "og:book:author",
      },
    };
    expect(runOne(rule, META_HTML).values).toEqual(["Colin O'Flynn", "Jasper van Woudenberg"]);
  });

  it("collects all three og:book:author values (the O'Reilly multi-author case, no split needed)", () => {
    const html = `
      <head>
        <meta property="og:book:author" itemprop="author" content="Fotios Chantzis">
        <meta property="og:book:author" itemprop="author" content="Ioannis Stais">
        <meta property="og:book:author" itemprop="author" content="Paulino Calderon">
      </head>
    `;
    const rule = {
      id: "oreilly-authors",
      extract: {
        source: "meta",
        metaKey: "og:book:author",
      },
    };
    expect(runOne(rule, html).values).toEqual([
      "Fotios Chantzis",
      "Ioannis Stais",
      "Paulino Calderon",
    ]);
  });

  it("matches a microdata `itemprop` meta tag", () => {
    const rule = {
      id: "author-itemprop",
      extract: {
        source: "meta",
        metaKey: "author",
      },
    };
    expect(runOne(rule, META_HTML).values).toEqual(["Colin O'Flynn"]);
  });

  it("still applies transforms to a meta value (date → ISO)", () => {
    const rule = {
      id: "pub-date",
      extract: {
        source: "meta",
        metaKey: "citation_publication_date",
        transform: [{
          kind: "date",
        }],
      },
    };
    expect(runOne(rule, META_HTML).values).toEqual(["2026-06-21"]);
  });

  it("yields no values when no meta tag matches the key", () => {
    const rule = {
      id: "missing",
      extract: {
        source: "meta",
        metaKey: "does:not:exist",
      },
    };
    expect(runOne(rule, META_HTML).values).toEqual([]);
  });
});

interface SectionEntryResult {
  name: string;
  type: string;
  startValue: string;
  url?: string;
  children?: SectionEntryResult[];
}

/** Run a single `sections` rule and return the structured `entries`. */
function runSections(rule: unknown, html: string): SectionEntryResult[] {
  const result = engine.runRules([rule], docFrom(html))[0] as FillResult & { entries?: SectionEntryResult[] };
  return result.entries ?? [];
}

describe("eesimpleFillEngine.runRules — sections target", () => {
  // A course accordion: chapter <h3> headers, each grouping sibling <a> video links (name in <p>).
  const ACCORDION_HTML = `
    <div class="acc">
      <h3 class="hdr">Chapter 1</h3>
      <div class="body">
        <a href="/v1"><p>Installing</p></a>
        <a href="/v2"><p>Workspace</p></a>
      </div>
    </div>
    <div class="acc">
      <h3 class="hdr">Chapter 2</h3>
      <div class="body">
        <a href="/v3"><p>Flowgraphs</p></a>
      </div>
    </div>
  `;

  it("builds a two-tier structure from a container + header + items", () => {
    const rule = {
      id: "chapters",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        container: ".acc",
        header: ".hdr",
        itemName: "p",
      },
      extract: {
        selector: "a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    expect(runSections(rule, ACCORDION_HTML)).toEqual([
      {
        name: "Chapter 1",
        type: "url",
        startValue: "",
        children: [
          {
            name: "Installing",
            type: "url",
            startValue: "/v1",
          },
          {
            name: "Workspace",
            type: "url",
            startValue: "/v2",
          },
        ],
      },
      {
        name: "Chapter 2",
        type: "url",
        startValue: "",
        children: [
          {
            name: "Flowgraphs",
            type: "url",
            startValue: "/v3",
          },
        ],
      },
    ]);
  });

  it("builds a flat list when no container is set", () => {
    const html = `
      <ul>
        <li class="row"><a href="/a"><span class="name">Alpha</span></a></li>
        <li class="row"><a href="/b"><span class="name">Beta</span></a></li>
      </ul>
    `;
    const rule = {
      id: "flat",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        itemName: ".name",
      },
      extract: {
        selector: ".row a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Alpha",
        type: "url",
        startValue: "/a",
      },
      {
        name: "Beta",
        type: "url",
        startValue: "/b",
      },
    ]);
  });

  it("reads a page number from the item text via the number transform", () => {
    const html = `
      <ul>
        <li class="row"><span class="name">Chapter One</span> p. 12</li>
        <li class="row"><span class="name">Chapter Two</span> p. 34</li>
      </ul>
    `;
    const rule = {
      id: "pages",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "page",
        itemName: ".name",
      },
      extract: {
        selector: ".row",
        transform: [{
          kind: "number",
        }],
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Chapter One",
        type: "page",
        startValue: "12",
      },
      {
        name: "Chapter Two",
        type: "page",
        startValue: "34",
      },
    ]);
  });

  it("parses timestamps from a description text block into seconds", () => {
    const html = `
      <div id="desc">0:00 Intro
1:23 Getting started
1:02:03 Deep dive</div>
    `;
    const rule = {
      id: "chapters",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "timestamp",
      },
      extract: {
        selector: "#desc",
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Intro",
        type: "timestamp",
        startValue: "0",
      },
      {
        name: "Getting started",
        type: "timestamp",
        startValue: "83",
      },
      {
        name: "Deep dive",
        type: "timestamp",
        startValue: "3723",
      },
    ]);
  });

  it("reads a per-item URL selector from a container item (name + link as siblings)", () => {
    const html = `
      <ul>
        <li class="row"><span class="name">Alpha</span><a class="link" href="/a">watch</a></li>
        <li class="row"><span class="name">Beta</span><a class="link" href="/b">watch</a></li>
      </ul>
    `;
    const rule = {
      id: "flat-url",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        itemName: ".name",
        itemUrl: ".link",
      },
      extract: {
        selector: ".row",
      },
    };
    // The item is the wrapper; name and url are read from separate children, url in its own field.
    expect(runSections(rule, html)).toEqual([
      {
        name: "Alpha",
        type: "url",
        startValue: "",
        url: "/a",
      },
      {
        name: "Beta",
        type: "url",
        startValue: "",
        url: "/b",
      },
    ]);
  });

  it("reads a per-item URL in tiered mode (children carry their own link)", () => {
    const html = `
      <div class="acc">
        <h3 class="hdr">Chapter 1</h3>
        <div class="item"><span class="name">Installing</span><a class="link" href="/v1">go</a></div>
        <div class="item"><span class="name">Workspace</span><a class="link" href="/v2">go</a></div>
      </div>
    `;
    const rule = {
      id: "tiered-url",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        container: ".acc",
        header: ".hdr",
        itemName: ".name",
        itemUrl: ".link",
      },
      extract: {
        selector: ".item",
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Chapter 1",
        type: "url",
        startValue: "",
        children: [
          {
            name: "Installing",
            type: "url",
            startValue: "",
            url: "/v1",
          },
          {
            name: "Workspace",
            type: "url",
            startValue: "",
            url: "/v2",
          },
        ],
      },
    ]);
  });

  it("keeps the positional value alongside a per-item URL for a page entry (orthogonal)", () => {
    const html = `
      <ul>
        <li class="row"><span class="name">Chapter One</span> p. 12 <a class="link" href="/x">read</a></li>
      </ul>
    `;
    const rule = {
      id: "page-url",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "page",
        itemName: ".name",
        itemUrl: ".link",
      },
      extract: {
        selector: ".row",
        transform: [{
          kind: "number",
        }],
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Chapter One",
        type: "page",
        startValue: "12",
        url: "/x",
      },
    ]);
  });

  it("stays backward-compatible when no itemUrl is set (link read into startValue, no url field)", () => {
    const html = `
      <ul>
        <li class="row"><a href="/a"><span class="name">Alpha</span></a></li>
      </ul>
    `;
    const rule = {
      id: "legacy",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        itemName: ".name",
      },
      extract: {
        selector: ".row a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    expect(runSections(rule, html)).toEqual([
      {
        name: "Alpha",
        type: "url",
        startValue: "/a",
      },
    ]);
  });

  // An O'Reilly-style flat ToC: "Part" headers and chapter links are all sibling <a>s, no container.
  const FLAT_TOC_HTML = `
    <ul class="toc">
      <li><a href="/preface">Preface</a></li>
      <li><a href="/part-1">Part 1: Foundations</a></li>
      <li><a href="/ch-1">Chapter 1. Getting Started</a></li>
      <li><a href="/ch-2">Chapter 2. Workflows</a></li>
      <li><a href="/part-2">Part 2: Advanced</a></li>
      <li><a href="/ch-3">Chapter 3. Runners</a></li>
    </ul>
  `;

  it("groups a flat item list into sections by item text match", () => {
    const rule = {
      id: "toc",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        sectionMatch: {
          mode: "regex",
          value: "^Part\\b",
        },
      },
      extract: {
        selector: ".toc a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    expect(runSections(rule, FLAT_TOC_HTML)).toEqual([
      // Pre-section item stays top-level.
      {
        name: "Preface",
        type: "url",
        startValue: "/preface",
      },
      // A matched header keeps its own value/link AND nests the following non-matching items.
      {
        name: "Part 1: Foundations",
        type: "url",
        startValue: "/part-1",
        children: [
          {
            name: "Chapter 1. Getting Started",
            type: "url",
            startValue: "/ch-1",
          },
          {
            name: "Chapter 2. Workflows",
            type: "url",
            startValue: "/ch-2",
          },
        ],
      },
      {
        name: "Part 2: Advanced",
        type: "url",
        startValue: "/part-2",
        children: [
          {
            name: "Chapter 3. Runners",
            type: "url",
            startValue: "/ch-3",
          },
        ],
      },
    ]);
  });

  it("prefers the text match over the container selector when both are set", () => {
    const rule = {
      id: "toc",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        container: ".acc",
        header: ".hdr",
        sectionMatch: {
          mode: "regex",
          value: "^Part\\b",
        },
      },
      extract: {
        selector: ".toc a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    // The container branch would find no `.acc` groups (empty); the sectionMatch branch runs instead.
    const entries = runSections(rule, FLAT_TOC_HTML);
    expect(entries.map(e => e.name)).toEqual(["Preface", "Part 1: Foundations", "Part 2: Advanced"]);
  });

  it("yields all-flat when the Selector excludes the section-header rows", () => {
    // Regression note: the section headers must be in the candidate set for grouping to work. On an
    // O'Reilly-style ToC the "Part" headers are link-less; a Selector restricted to anchors matches
    // only the chapter links, so no row's name contains "Part" → every row becomes a flat top-level
    // section (the "20 sections instead of 3" report). The fix is a Selector matching every row.
    const html = `
      <ul class="toc">
        <li><h5>Part 1: Foundations</h5></li>
        <li><h5><a href="/ch-1">Chapter 1. Getting Started</a></h5></li>
        <li><h5><a href="/ch-2">Chapter 2. Workflows</a></h5></li>
      </ul>
    `;
    const rule = {
      id: "toc",
      target: {
        kind: "sections",
        propertyId: "p",
        entryType: "url",
        sectionMatch: {
          mode: "contains",
          value: "Part ",
        },
      },
      // Anchor-only selector: the link-less "Part" header never enters the candidate set.
      extract: {
        selector: ".toc h5 a",
        read: {
          kind: "attr",
          name: "href",
        },
      },
    };
    const entries = runSections(rule, html);
    expect(entries.map(e => e.name)).toEqual(["Chapter 1. Getting Started", "Chapter 2. Workflows"]);
    expect(entries.every(e => e.children === undefined)).toBe(true);

    // With a Selector that matches every row (the h5s), the Part header groups its chapters.
    const grouped = runSections({
      ...rule,
      extract: {
        selector: ".toc h5",
      },
    }, html);
    expect(grouped.map(e => e.name)).toEqual(["Part 1: Foundations"]);
    expect(grouped[0].children?.map(c => c.name)).toEqual([
      "Chapter 1. Getting Started",
      "Chapter 2. Workflows",
    ]);
  });

  it("leaves non-sections rules with no `entries` key", () => {
    const result = engine.runRules(
      [{
        id: "plain",
        extract: {
          selector: ".item",
        },
      }],
      docFrom("<ul><li class=\"item\">One</li></ul>"),
    )[0] as FillResult & { entries?: unknown };
    expect(result.entries).toBeUndefined();
    expect(result.values).toEqual(["One"]);
  });
});

interface TaxonomyFill {
  TAXONOMY_ENTITY_PATCH: Record<string, { path: string;
    nameKey: string;
    noun: string;
    image?: boolean; }>;
}

const taxonomyFill = (globalThis as unknown as { eesimpleTaxonomyFill: TaxonomyFill }).eesimpleTaxonomyFill;

describe("eesimpleFillEngine.runRules — taxonomyDirect resolve.select (match mode)", () => {
  const HTML = `
    <main>
      <h1 class="creator">Veritasium</h1>
      <p class="bio">Science videos.</p>
    </main>
  `;

  it("attaches resolveValue (the scraped entity name) for a match-mode direct rule", () => {
    const rule = {
      id: "d1",
      target: {
        kind: "taxonomyDirect",
        association: "people",
        resolve: {
          mode: "match",
          select: {
            selector: "h1.creator",
          },
        },
        field: "description",
      },
      extract: {
        selector: "p.bio",
      },
    };
    const result = engine.runRules([rule], docFrom(HTML))[0] as FillResult & { resolveValue?: string };
    // The field value comes from the top-level extract; the entity identifier from resolve.select.
    expect(result.values).toEqual(["Science videos."]);
    expect(result.resolveValue).toBe("Veritasium");
  });

  it("does not attach resolveValue for a url-mode direct rule", () => {
    const rule = {
      id: "d2",
      target: {
        kind: "taxonomyDirect",
        association: "website",
        resolve: {
          mode: "url",
        },
        field: "name",
      },
      extract: {
        selector: "h1.creator",
      },
    };
    const result = engine.runRules([rule], docFrom(HTML))[0] as FillResult & { resolveValue?: string };
    expect(result.values).toEqual(["Veritasium"]);
    expect(result.resolveValue).toBeUndefined();
  });
});

describe("taxonomyFill.js TAXONOMY_ENTITY_PATCH mirror stays aligned with the TS registry", () => {
  it("marks image: true exactly on the image-capable associations (sync-point guard)", () => {
    const specs = Object.entries(TAXONOMY_ENTITY_SPECS) as [string, TaxonomyEntityAssociationSpec][];
    for (const [association, spec] of specs) {
      const mirror = taxonomyFill.TAXONOMY_ENTITY_PATCH[association];
      expect(mirror, `missing mirror for ${association}`).toBeDefined();
      expect(mirror.path).toBe(spec.apiPath);
      expect(!!mirror.image, `image capability drift for ${association}`).toBe(!!spec.image);
    }
  });
});
