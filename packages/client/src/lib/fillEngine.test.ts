// Side-effect import: the classic extension script assigns `globalThis.eesimpleFillEngine`.
import "../../public/extension/fillEngine.js";

import { describe, expect, it } from "vitest";

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
