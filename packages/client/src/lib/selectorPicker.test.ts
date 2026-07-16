// Side-effect imports: the classic extension scripts assign `globalThis.eesimpleFillEngine`
// (used by the sample-value preview) / `globalThis.eesimpleSelectorPicker`.
import "../../public/extension/fillEngine.js";
import "../../public/extension/selectorPicker.js";

import { describe, expect, it } from "vitest";

interface GenResult {
  selector: string;
  unique?: boolean;
  matchCount: number;
  matchesAll?: boolean;
  exact?: boolean;
  container?: string;
}

interface SelectorPicker {
  buildRobustSelector(el: Element, doc?: Document): GenResult;
  buildCommonSelector(elements: Element[], doc?: Document): GenResult;
  buildExactSelector(elements: Element[], doc?: Document): GenResult;
  buildRelativeSelector(root: Element, el: Element): GenResult;
  classifyClassToken(token: string): { kind: string;
    token: string;
    stable?: string; } | null;
  sampleValueFor(selector: string, read: unknown, doc?: Document): string;
  start(): void;
  teardown(): void;
}

const picker = (globalThis as unknown as { eesimpleSelectorPicker: SelectorPicker }).eesimpleSelectorPicker;

/** Parse fixture HTML into an isolated document (also exercises the `doc` parameter). */
function docFrom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("classifyClassToken", () => {
  it("treats a CSS-modules rotating-hash token as rotating with a stable substring", () => {
    expect(picker.classifyClassToken("_statBlockTitle_1ckth_86")).toEqual({
      kind: "rotating",
      token: "_statBlockTitle_1ckth_86",
      stable: "statBlockTitle",
    });
  });

  it("picks the local name from a styles_name__hash token", () => {
    expect(picker.classifyClassToken("styles_button__x7f2a")).toMatchObject({
      kind: "rotating",
      stable: "button",
    });
  });

  it("leaves a plain stable class alone", () => {
    expect(picker.classifyClassToken("nav-item")).toEqual({
      kind: "stable",
      token: "nav-item",
    });
  });

  it("does not mistake a numeric-suffixed utility class for a hash", () => {
    expect(picker.classifyClassToken("col-md-6")).toEqual({
      kind: "stable",
      token: "col-md-6",
    });
  });
});

describe("buildRobustSelector (unique)", () => {
  it("prefers a stable id", () => {
    const doc = docFrom("<div id=\"main\"><span id=\"price\">$10</span></div>");
    const el = doc.getElementById("price")!;
    const r = picker.buildRobustSelector(el, doc);
    expect(r.selector).toBe("#price");
    expect(r.unique).toBe(true);
    expect(doc.querySelectorAll(r.selector)).toHaveLength(1);
  });

  it("prefers a stable data/semantic attribute over classes", () => {
    const doc = docFrom("<div><span data-testid=\"author\" class=\"x9f2a1\">Ada</span></div>");
    const el = doc.querySelector("[data-testid=author]")!;
    const r = picker.buildRobustSelector(el, doc);
    expect(r.selector).toContain("[data-testid=");
    expect(doc.querySelector(r.selector)).toBe(el);
  });

  it("matches a rotating-hash class via a [class*=...] substring", () => {
    const doc = docFrom(`
      <div class="_wrap_ab12"><h1 class="_title_9xkq_3">Hello</h1></div>
    `);
    const el = doc.querySelector("h1")!;
    const r = picker.buildRobustSelector(el, doc);
    expect(r.selector).toContain("[class*=\"title\"]");
    expect(r.unique).toBe(true);
    expect(doc.querySelector(r.selector)).toBe(el);
  });

  it("uses a stable class when available", () => {
    const doc = docFrom("<article><p class=\"lede\">Intro</p><p>Body</p></article>");
    const el = doc.querySelector(".lede")!;
    const r = picker.buildRobustSelector(el, doc);
    expect(doc.querySelector(r.selector)).toBe(el);
    expect(doc.querySelectorAll(r.selector)).toHaveLength(1);
  });

  it("falls back to an nth-of-type path when nothing is distinctive", () => {
    const doc = docFrom("<ul id=\"list\"><li>a</li><li>b</li><li>c</li></ul>");
    const el = doc.querySelectorAll("li")[2]!;
    const r = picker.buildRobustSelector(el, doc);
    expect(r.unique).toBe(true);
    expect(doc.querySelector(r.selector)).toBe(el);
  });
});

describe("buildCommonSelector (generalize / many-match)", () => {
  it("finds a selector matching all sibling items sharing a stable class", () => {
    const doc = docFrom(`
      <ul>
        <li class="course-item">A</li>
        <li class="course-item">B</li>
        <li class="course-item">C</li>
      </ul>
    `);
    const items = Array.from(doc.querySelectorAll("li"));
    const r = picker.buildCommonSelector([items[0]!, items[1]!], doc);
    expect(r.matchesAll).toBe(true);
    // Generalizes to the whole set, not just the two examples.
    expect(r.matchCount).toBe(3);
    expect(doc.querySelectorAll(r.selector)).toHaveLength(3);
  });

  it("intersects rotating-hash classes by their stable substring", () => {
    const doc = docFrom(`
      <div>
        <div class="_row_1a2b _item_9x8y">1</div>
        <div class="_row_3c4d _item_7w6v">2</div>
        <div class="_other_5e6f">nope</div>
      </div>
    `);
    const rows = Array.from(doc.querySelectorAll("div > div"));
    const r = picker.buildCommonSelector([rows[0]!, rows[1]!], doc);
    expect(r.matchesAll).toBe(true);
    expect(r.matchCount).toBe(2);
    expect(r.selector).toContain("[class*=\"");
  });

  it("returns a single robust selector when given one element", () => {
    const doc = docFrom("<div><span id=\"only\">x</span></div>");
    const r = picker.buildCommonSelector([doc.getElementById("only")!], doc);
    expect(r.selector).toBe("#only");
    expect(r.matchesAll).toBe(true);
  });
});

describe("buildExactSelector (list / only-selected)", () => {
  it("matches exactly the picked elements, not their siblings", () => {
    const doc = docFrom(`
      <ul>
        <li class="item">A</li>
        <li class="item">B</li>
        <li class="item">C</li>
      </ul>
    `);
    const items = Array.from(doc.querySelectorAll("li"));
    const r = picker.buildExactSelector([items[0]!, items[2]!], doc);
    expect(r.exact).toBe(true);
    expect(r.matchCount).toBe(2);
    // Only the two picked (A and C) — NOT the un-picked sibling B (buildCommonSelector would match all 3).
    expect(Array.from(doc.querySelectorAll(r.selector))).toEqual([items[0], items[2]]);
  });

  it("de-dupes repeated picks of the same element", () => {
    const doc = docFrom("<ul><li class=\"item\">A</li><li class=\"item\">B</li></ul>");
    const items = Array.from(doc.querySelectorAll("li"));
    const r = picker.buildExactSelector([items[0]!, items[0]!], doc);
    expect(r.matchCount).toBe(1);
    expect(doc.querySelector(r.selector)).toBe(items[0]);
  });

  it("returns the single element's unique selector for one pick", () => {
    const doc = docFrom("<div><span id=\"x\">1</span></div>");
    const r = picker.buildExactSelector([doc.getElementById("x")!], doc);
    expect(r.selector).toBe("#x");
    expect(r.matchCount).toBe(1);
    expect(r.exact).toBe(true);
  });
});

describe("buildRelativeSelector (item-scoped)", () => {
  const COURSE_HTML = `
    <ul class="curriculum">
      <li class="lesson">
        <a class="lesson-link" href="/l/1"><span class="lesson-name">Intro</span></a>
      </li>
      <li class="lesson">
        <a class="lesson-link" href="/l/2"><span class="lesson-name">Setup</span></a>
      </li>
    </ul>
  `;

  it("resolves a name selector that works within each repeated item", () => {
    const doc = docFrom(COURSE_HTML);
    const items = Array.from(doc.querySelectorAll("li.lesson"));
    const nameEl = items[0]!.querySelector(".lesson-name")!;
    const r = picker.buildRelativeSelector(items[0]!, nameEl);
    expect(r.unique).toBe(true);
    // The relative selector must uniquely resolve the name inside every item.
    items.forEach((item) => {
      expect(item.querySelectorAll(r.selector)).toHaveLength(1);
    });
  });

  it("resolves a link selector relative to the item root", () => {
    const doc = docFrom(COURSE_HTML);
    const items = Array.from(doc.querySelectorAll("li.lesson"));
    const linkEl = items[1]!.querySelector("a")!;
    const r = picker.buildRelativeSelector(items[1]!, linkEl);
    expect(items[1]!.querySelector(r.selector)).toBe(linkEl);
  });

  it("does not anchor on an absolute id", () => {
    const doc = docFrom("<div class=\"item\"><span id=\"abs123\">v</span></div>");
    const root = doc.querySelector(".item")!;
    const el = doc.getElementById("abs123")!;
    const r = picker.buildRelativeSelector(root, el);
    expect(r.selector.startsWith("#")).toBe(false);
  });
});

describe("sampleValueFor", () => {
  it("previews the extracted text through the fill engine", () => {
    const doc = docFrom("<h1 class=\"title\">Clean Code</h1>");
    expect(picker.sampleValueFor(".title", null, doc)).toBe("Clean Code");
  });

  it("reads an attribute when a read override is given", () => {
    const doc = docFrom("<a class=\"perma\" href=\"https://example.com/x\">link</a>");
    expect(picker.sampleValueFor(".perma", {
      kind: "attr",
      name: "href",
    }, doc)).toBe("https://example.com/x");
  });
});

describe("overlay toolbar", () => {
  // Regression guard: the toolbar's stopPropagation listener must be BUBBLE-phase, not capture. A
  // capture-phase listener on the bar halts the click before its own buttons' target-phase onclick
  // fires, making every toolbar button dead (the "can't click the picker buttons" bug).
  it("mode-switch buttons respond to clicks", () => {
    // jsdom lacks document.elementFromPoint; the document-level pick handler calls it. In a real
    // browser a toolbar click resolves to an element inside the bar, so the handler sees null and
    // early-returns — stub that so the handler is a no-op (the bug under test is the bar listener).
    const docWithPoint = document as Document & { elementFromPoint?: (x: number, y: number) => Element | null };
    const originalElementFromPoint = docWithPoint.elementFromPoint;
    docWithPoint.elementFromPoint = () => null;
    picker.start();
    try {
      const listButton = document.querySelector("button[data-mode=\"list\"]");
      expect(listButton).not.toBeNull();
      // Initial (single) mode shows the single-mode prompt, not the list prompt.
      expect(document.body.textContent).not.toContain("each element to include");

      listButton!.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      }));

      // The button's onclick fired → setMode("list") → the list prompt is now shown.
      expect(document.body.textContent).toContain("each element to include");
    }
    finally {
      picker.teardown();
      docWithPoint.elementFromPoint = originalElementFromPoint;
    }
  });
});
