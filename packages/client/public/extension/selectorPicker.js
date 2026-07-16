/* global chrome */
/*
 * eeSimple Bookmarks — extension "selector finder" picker.
 *
 * A classic browser script (no import/export) that assigns `globalThis.eesimpleSelectorPicker`.
 * The popup injects this file into the page with `chrome.scripting.executeScript` (alongside
 * `fillEngine.js`) and then calls `eesimpleSelectorPicker.start()`; the picker runs standalone in
 * the page (the MV3 action popup closes the instant the page takes focus) and, when the user
 * confirms, writes the chosen selector(s) to `chrome.storage.local` for the popup to pick up on
 * its next open. The jsdom test suite imports this module for its side effect and exercises the
 * three PURE generators against fixture HTML:
 *
 *   - `buildRobustSelector(el, doc)`      — a UNIQUE selector for a single element (scalar fields).
 *   - `buildCommonSelector(elements, doc)`— a MANY-MATCH selector common to 2+ example elements
 *                                            (lists / a Sections item selector).
 *   - `buildRelativeSelector(root, el)`     — a selector for `el` scoped WITHIN `root` (a Section
 *                                            item's `itemName` / `itemUrl`, resolved per item).
 *
 * All three verify their result by match count against the live DOM (`querySelectorAll`), and
 * follow the codebase's selector philosophy: prefer `#id` / stable data/aria/semantic attributes,
 * then stable classes, and for a rotating-hash class name (e.g. `_statBlockTitle_1ckth_86`) match a
 * stable substring via `[class*="statBlockTitle"]` rather than the volatile full token.
 *
 * The overlay/interaction half references `document` / `window` / `chrome` but only inside
 * `start()`, so importing the module in a non-browser test never touches them.
 */
(function () {
  var STABLE_ATTRS = ["data-testid", "data-test", "data-qa", "data-cy", "itemprop", "aria-label", "name", "role"];
  var STORAGE_KEY = "eesimple:pendingSelector";

  // --- small DOM/string helpers -------------------------------------------------------------

  function tagName(el) {
    return (el.tagName || "").toLowerCase();
  }

  function cssEscape(value) {
    if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") return CSS.escape(value);
    // Minimal fallback: escape anything that isn't a safe identifier char.
    return String(value).replace(/[^\w-]/g, function (ch) {
      return "\\" + ch;
    });
  }

  function matchCount(selector, doc) {
    try {
      return doc.querySelectorAll(selector).length;
    }
    catch {
      return -1;
    }
  }

  // --- class-token classification (the rotating-hash heuristic) ------------------------------

  function segmentsOf(token) {
    return token.split(/[_-]+/).filter(Boolean);
  }

  // A segment looks like a build hash (rotating), not a human name: a run of alphanumerics mixing
  // letters + digits, a long pure-number, or a hex-ish run. `statBlockTitle` (letters only) is NOT
  // hashy; `1ckth` / `x7f2a` / `86`(len>=3) are.
  function looksHashy(segment) {
    if (/^\d{3,}$/.test(segment)) return true;
    if (segment.length >= 4 && /\d/.test(segment) && /[a-z]/i.test(segment)) return true;
    if (segment.length >= 6 && /^[0-9a-f]+$/i.test(segment) && /\d/.test(segment)) return true;
    return false;
  }

  function isRotatingToken(token) {
    return segmentsOf(token).some(looksHashy);
  }

  // The most identifying stable segment of a rotating token — the last letter-bearing, non-hashy
  // segment (the CSS-modules local name, e.g. `button` in `styles_button__x7f2a`).
  function stableSubstring(token) {
    var segs = segmentsOf(token).filter(function (s) {
      return !looksHashy(s) && /[a-z]/i.test(s);
    });
    return segs.length ? segs[segs.length - 1] : null;
  }

  function classifyClassToken(token) {
    if (!token) return null;
    if (isRotatingToken(token)) {
      var stable = stableSubstring(token);
      return stable
        ? {
          kind: "rotating",
          token: token,
          stable: stable,
        }
        : null;
    }
    return {
      kind: "stable",
      token: token,
    };
  }

  function isValidId(id) {
    return /^[A-Za-z][\w-]*$/.test(id) && !isRotatingToken(id);
  }

  // --- candidate selector generation --------------------------------------------------------

  function classFragments(el) {
    var frags = [];
    var list = el.classList ? Array.prototype.slice.call(el.classList) : [];
    list.forEach(function (cls) {
      var info = classifyClassToken(cls);
      if (!info) return;
      if (info.kind === "stable") frags.push("." + cssEscape(info.token));
      else frags.push("[class*=\"" + info.stable + "\"]");
    });
    return frags;
  }

  // Ordered single-level selectors for `el`, most-specific first: id, stable attrs, other data-*,
  // tag+all-classes, tag+each-class, bare tag.
  function levelCandidates(el) {
    var tag = tagName(el);
    var out = [];
    if (el.id && isValidId(el.id)) out.push("#" + cssEscape(el.id));
    STABLE_ATTRS.forEach(function (attr) {
      var v = el.getAttribute ? el.getAttribute(attr) : null;
      if (v && v.length && v.length < 80) out.push(tag + "[" + attr + "=" + JSON.stringify(v) + "]");
    });
    if (el.attributes) {
      Array.prototype.forEach.call(el.attributes, function (at) {
        if (at.name.indexOf("data-") === 0
          && STABLE_ATTRS.indexOf(at.name) === -1
          && at.value && at.value.length < 80 && !isRotatingToken(at.value)) {
          out.push(tag + "[" + at.name + "=" + JSON.stringify(at.value) + "]");
        }
      });
    }
    var frags = classFragments(el);
    if (frags.length) {
      out.push(tag + frags.join(""));
      frags.forEach(function (f) {
        out.push(tag + f);
      });
    }
    out.push(tag);
    // Dedupe while preserving order.
    var seen = {};
    return out.filter(function (s) {
      if (seen[s]) return false;
      seen[s] = true;
      return true;
    });
  }

  function firstUnique(candidates, el, doc) {
    for (const candidate of candidates) {
      if (matchCount(candidate, doc) === 1 && doc.querySelector(candidate) === el) return candidate;
    }
    return null;
  }

  function ancestorScopedSelector(el, doc) {
    var anc = el.parentElement;
    var depth = 0;
    while (anc && depth < 6) {
      var ancSel = firstUnique(levelCandidates(anc), anc, doc);
      if (ancSel) {
        var frags = levelCandidates(el);
        for (const frag of frags) {
          var descendant = ancSel + " " + frag;
          if (matchCount(descendant, doc) === 1 && doc.querySelector(descendant) === el) {
            return {
              selector: descendant,
              unique: true,
              matchCount: 1,
            };
          }
          var child = ancSel + " > " + frag;
          if (matchCount(child, doc) === 1 && doc.querySelector(child) === el) {
            return {
              selector: child,
              unique: true,
              matchCount: 1,
            };
          }
        }
      }
      anc = anc.parentElement;
      depth++;
    }
    return null;
  }

  function nthOfTypePath(el, doc) {
    var parts = [];
    var cur = el;
    var guard = 0;
    while (cur && cur.nodeType === 1 && cur !== doc.documentElement && guard < 8) {
      var tag = tagName(cur);
      var parent = cur.parentElement;
      var idx = 1;
      var sib = cur;
      while ((sib = sib.previousElementSibling)) {
        if (tagName(sib) === tag) idx++;
      }
      parts.unshift(tag + ":nth-of-type(" + idx + ")");
      if (!parent) break;
      var ancSel = firstUnique(levelCandidates(parent), parent, doc);
      if (ancSel) {
        parts.unshift(ancSel);
        break;
      }
      cur = parent;
      guard++;
    }
    var sel = parts.join(" > ");
    if (matchCount(sel, doc) === 1 && doc.querySelector(sel) === el) {
      return {
        selector: sel,
        unique: true,
        matchCount: 1,
      };
    }
    return null;
  }

  // 1) UNIQUE selector for a single element.
  function buildRobustSelector(el, doc) {
    doc = doc || (el && el.ownerDocument) || (typeof document !== "undefined" ? document : null);
    if (!el || !doc) {
      return {
        selector: "",
        unique: false,
        matchCount: 0,
      };
    }
    var cands = levelCandidates(el);
    var best = null;
    for (const cand of cands) {
      var n = matchCount(cand, doc);
      if (n === 1 && doc.querySelector(cand) === el) {
        return {
          selector: cand,
          unique: true,
          matchCount: 1,
        };
      }
      if (n >= 1 && !best) {
        best = {
          selector: cand,
          unique: false,
          matchCount: n,
        };
      }
    }
    var scoped = ancestorScopedSelector(el, doc);
    if (scoped) return scoped;
    var path = nthOfTypePath(el, doc);
    if (path) return path;
    if (best) return best;
    var tag = tagName(el);
    return {
      selector: tag,
      unique: false,
      matchCount: matchCount(tag, doc),
    };
  }

  // --- common (generalize) selector ---------------------------------------------------------

  // {stableKey -> selectorFragment} for one element (rotating tokens keyed by their stable part so
  // two items with differently-hashed copies of the same class intersect).
  function elementFragmentMap(el) {
    var map = {};
    var list = el.classList ? Array.prototype.slice.call(el.classList) : [];
    list.forEach(function (cls) {
      var info = classifyClassToken(cls);
      if (!info) return;
      if (info.kind === "stable") map["c:" + info.token] = "." + cssEscape(info.token);
      else map["r:" + info.stable] = "[class*=\"" + info.stable + "\"]";
    });
    return map;
  }

  function commonClassFragments(elements) {
    var maps = elements.map(elementFragmentMap);
    var first = maps[0] || {};
    var frags = [];
    Object.keys(first).forEach(function (key) {
      if (maps.every(function (m) {
        return m[key];
      })) frags.push(first[key]);
    });
    return frags;
  }

  function matchesAllElements(selector, elements, doc) {
    var found;
    try {
      found = doc.querySelectorAll(selector);
    }
    catch {
      return false;
    }
    var set = Array.prototype.slice.call(found);
    return elements.every(function (el) {
      return set.indexOf(el) !== -1;
    });
  }

  function lowestCommonAncestor(elements, doc) {
    var chain = [];
    var cur = elements[0];
    while (cur) {
      chain.push(cur);
      cur = cur.parentElement;
    }
    for (const cand of chain) {
      var containsAll = elements.every(function (el) {
        return cand.contains(el);
      });
      if (containsAll) return cand === elements[0] ? cand.parentElement : cand;
    }
    return doc.body || null;
  }

  // 2) MANY-MATCH selector common to 2+ example elements.
  function buildCommonSelector(elements, doc) {
    elements = (elements || []).filter(Boolean);
    if (elements.length === 0) {
      return {
        selector: "",
        matchCount: 0,
        matchesAll: false,
      };
    }
    doc = doc || elements[0].ownerDocument || (typeof document !== "undefined" ? document : null);
    if (elements.length < 2) {
      var one = buildRobustSelector(elements[0], doc);
      return {
        selector: one.selector,
        matchCount: one.matchCount,
        matchesAll: true,
      };
    }
    var tag = tagName(elements[0]);
    var sameTag = elements.every(function (el) {
      return tagName(el) === tag;
    });
    var common = commonClassFragments(elements);
    var candidates = [];
    if (sameTag && common.length) candidates.push(tag + common.join(""));
    if (common.length) candidates.push((sameTag ? tag : "*") + common.join(""));
    if (sameTag) candidates.push(tag);
    for (const candidate of candidates) {
      if (matchesAllElements(candidate, elements, doc)) {
        return {
          selector: candidate,
          matchCount: matchCount(candidate, doc),
          matchesAll: true,
        };
      }
    }
    var container = lowestCommonAncestor(elements, doc);
    if (container) {
      var containerSel = buildRobustSelector(container, doc);
      var frag = (sameTag ? tag : "*") + (common.length ? common.join("") : "");
      var scoped = containerSel.selector + " " + frag;
      if (matchesAllElements(scoped, elements, doc)) {
        return {
          selector: scoped,
          container: containerSel.selector,
          matchCount: matchCount(scoped, doc),
          matchesAll: true,
        };
      }
    }
    var fallback = candidates[0] || tag;
    return {
      selector: fallback,
      matchCount: matchCount(fallback, doc),
      matchesAll: matchesAllElements(fallback, elements, doc),
    };
  }

  // 2b) EXACT-SET selector for the picked elements ONLY (List mode) — the opposite of the generalizing
  // `buildCommonSelector`. Unions each element's own unique selector (a CSS selector list, which the
  // fill engine's `querySelectorAll` supports), so it resolves to exactly the picked nodes and not their
  // siblings. `exact` is false only when an element fell back to a non-unique selector that over-matches.
  function buildExactSelector(elements, doc) {
    var distinct = [];
    (elements || []).forEach(function (el) {
      if (el && distinct.indexOf(el) === -1) distinct.push(el);
    });
    if (distinct.length === 0) {
      return {
        selector: "",
        matchCount: 0,
        exact: false,
      };
    }
    doc = doc || distinct[0].ownerDocument || (typeof document !== "undefined" ? document : null);
    var parts = [];
    distinct.forEach(function (el) {
      var one = buildRobustSelector(el, doc).selector;
      if (one && parts.indexOf(one) === -1) parts.push(one);
    });
    var selector = parts.join(", ");
    var count = selector ? matchCount(selector, doc) : 0;
    var exact = count === distinct.length && matchesAllElements(selector, distinct, doc);
    return {
      selector: selector,
      matchCount: count,
      exact: exact,
    };
  }

  // --- relative (item-scoped) selector ------------------------------------------------------

  function relativePath(root, el) {
    var parts = [];
    var cur = el;
    while (cur && cur !== root && cur.parentElement) {
      var tag = tagName(cur);
      var idx = 1;
      var sib = cur;
      while ((sib = sib.previousElementSibling)) {
        if (tagName(sib) === tag) idx++;
      }
      parts.unshift(tag + ":nth-of-type(" + idx + ")");
      cur = cur.parentElement;
    }
    return cur === root ? parts.join(" > ") : null;
  }

  // 3) A selector for `el` unique WITHIN `root` (a repeated item element). Everything is scoped to
  // `root` via `root.querySelectorAll`, so no document reference is needed (or accepted).
  function buildRelativeSelector(root, el) {
    if (!root || !el) {
      return {
        selector: "",
        unique: false,
        matchCount: 0,
      };
    }
    // Absolute ids aren't meaningful inside a repeated item — skip them.
    var cands = levelCandidates(el).filter(function (c) {
      return c.charAt(0) !== "#";
    });
    for (const cand of cands) {
      var within;
      try {
        within = root.querySelectorAll(cand);
      }
      catch {
        continue;
      }
      if (within.length === 1 && within[0] === el) {
        return {
          selector: cand,
          unique: true,
          matchCount: 1,
        };
      }
    }
    var path = relativePath(root, el);
    if (path) {
      try {
        var m = root.querySelectorAll(path);
        if (m.length === 1 && m[0] === el) {
          return {
            selector: path,
            unique: true,
            matchCount: 1,
          };
        }
      }
      catch {
        // fall through to best-effort
      }
    }
    var first = cands[0] || tagName(el);
    var count;
    try {
      count = root.querySelectorAll(first).length;
    }
    catch {
      count = 0;
    }
    return {
      selector: first,
      unique: count === 1,
      matchCount: count,
    };
  }

  // --- read-mode default + engine-backed sample preview -------------------------------------

  function defaultRead(el) {
    var tag = tagName(el);
    if (tag === "img") {
      return {
        kind: "attr",
        name: "src",
      };
    }
    if (tag === "a") {
      return {
        kind: "attr",
        name: "href",
      };
    }
    return {
      kind: "text",
    };
  }

  // Preview a selector's extracted value through the REAL fill engine, so what the user sees equals
  // what a fill would produce. Returns "" when the engine isn't loaded or nothing matches.
  function sampleValueFor(selector, read, doc) {
    doc = doc || (typeof document !== "undefined" ? document : null);
    if (!selector || !doc || !globalThis.eesimpleFillEngine) return "";
    var rule = {
      id: "__sample__",
      target: {
        kind: "field",
        field: "title",
      },
      extract: {
        selector: selector,
      },
    };
    if (read) rule.extract.read = read;
    try {
      var res = globalThis.eesimpleFillEngine.runRules([rule], doc);
      var vals = res && res[0] && res[0].values;
      return vals && vals.length ? String(vals[0]) : "";
    }
    catch {
      return "";
    }
  }

  // ==========================================================================================
  // Overlay / interaction — browser-only; never runs at import (only inside `start()`).
  // ==========================================================================================

  var ui = null;

  function teardown() {
    if (!ui) return;
    document.removeEventListener("mousemove", ui.onMove, true);
    document.removeEventListener("click", ui.onClick, true);
    document.removeEventListener("keydown", ui.onKey, true);
    if (ui.highlight && ui.highlight.parentNode) ui.highlight.parentNode.removeChild(ui.highlight);
    ui.marks.forEach(function (m) {
      if (m.parentNode) m.parentNode.removeChild(m);
    });
    if (ui.bar && ui.bar.parentNode) ui.bar.parentNode.removeChild(ui.bar);
    globalThis.__eesimpleSelectorPickerActive = false;
    ui = null;
  }

  function box(styles) {
    var el = document.createElement("div");
    el.style.cssText = styles;
    return el;
  }

  function positionOver(marker, target) {
    var r = target.getBoundingClientRect();
    marker.style.top = (r.top + window.scrollY) + "px";
    marker.style.left = (r.left + window.scrollX) + "px";
    marker.style.width = r.width + "px";
    marker.style.height = r.height + "px";
  }

  function clearMarks() {
    ui.marks.forEach(function (m) {
      if (m.parentNode) m.parentNode.removeChild(m);
    });
    ui.marks = [];
  }

  // Paint a persistent outline over every element a selector matches (the "matches N" preview).
  function highlightMatches(selector, doc) {
    clearMarks();
    var found;
    try {
      found = doc.querySelectorAll(selector);
    }
    catch {
      return 0;
    }
    Array.prototype.forEach.call(found, function (el) {
      var m = box("position:absolute;z-index:2147483646;pointer-events:none;border:2px solid #16a34a;"
        + "background:rgba(22,163,74,0.12);box-sizing:border-box;");
      document.body.appendChild(m);
      positionOver(m, el);
      ui.marks.push(m);
    });
    return found.length;
  }

  function setStatus(html) {
    if (ui && ui.status) ui.status.innerHTML = html;
  }

  function suggestLabel(value) {
    var v = (value || "").replace(/\s+/g, " ").trim();
    return v ? v.slice(0, 40) : "New rule";
  }

  function persistAndClose(result) {
    result.ts = Date.now();
    result.url = location.href;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        [STORAGE_KEY]: result,
      }, function () {
        setStatus("Saved. Reopen the eeSimple popup to finish creating the rule.");
        setTimeout(teardown, 2500);
      });
    }
    else {
      setStatus("Couldn't reach extension storage.");
    }
  }

  function elementFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    if (el && ui && (el === ui.bar || ui.bar.contains(el))) return null;
    return el;
  }

  // Build the fixed toolbar (mode switch + status + confirm/cancel).
  function buildBar() {
    var bar = box("position:fixed;z-index:2147483647;left:50%;transform:translateX(-50%);bottom:16px;"
      + "max-width:92vw;background:#111827;color:#f9fafb;font:13px/1.4 system-ui,sans-serif;"
      + "padding:10px 12px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.4);");
    // Keep toolbar clicks off the page underneath, but register in the BUBBLE phase (not capture): a
    // capture-phase stopPropagation on the bar would halt the event before it reached its own buttons'
    // target-phase `onclick` handlers, making every toolbar button dead. The document-level pick handler
    // already ignores toolbar clicks (elementFromPoint returns null inside the bar), so bubble is enough.
    bar.addEventListener("click", function (e) {
      e.stopPropagation();
    }, false);

    var modes = box("display:flex;gap:6px;margin-bottom:8px;");
    ["single", "list", "section"].forEach(function (mode) {
      var b = document.createElement("button");
      b.textContent = mode === "single" ? "Single" : mode === "list" ? "List" : "Section";
      b.dataset.mode = mode;
      b.style.cssText = "flex:1;padding:4px 8px;border:0;border-radius:6px;cursor:pointer;"
        + "background:#374151;color:#f9fafb;font:12px system-ui;";
      b.onclick = function () {
        setMode(mode);
      };
      modes.appendChild(b);
    });

    var status = box("margin:6px 0;min-height:18px;");
    var actions = box("display:flex;gap:6px;margin-top:8px;");

    var useBtn = document.createElement("button");
    useBtn.textContent = "Use this";
    useBtn.style.cssText = "flex:1;padding:6px 10px;border:0;border-radius:6px;cursor:pointer;"
      + "background:#2563eb;color:#fff;font:12px system-ui;";
    useBtn.onclick = function () {
      confirmCurrent();
    };

    var nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.style.cssText = useBtn.style.cssText;
    nextBtn.style.background = "#059669";
    nextBtn.onclick = function () {
      advanceSection();
    };

    var cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "padding:6px 10px;border:0;border-radius:6px;cursor:pointer;"
      + "background:#4b5563;color:#f9fafb;font:12px system-ui;";
    cancelBtn.onclick = teardown;

    actions.appendChild(useBtn);
    actions.appendChild(nextBtn);
    actions.appendChild(cancelBtn);
    bar.appendChild(modes);
    bar.appendChild(status);
    bar.appendChild(actions);
    document.body.appendChild(bar);

    return {
      bar: bar,
      status: status,
      modeButtons: modes,
      useBtn: useBtn,
      nextBtn: nextBtn,
    };
  }

  function refreshModeButtons() {
    Array.prototype.forEach.call(ui.modeButtons.children, function (b) {
      b.style.background = b.dataset.mode === ui.state.mode ? "#2563eb" : "#374151";
    });
    var sectioning = ui.state.mode === "section" && ui.state.section.itemSelector;
    ui.nextBtn.style.display = (ui.state.mode === "section") ? "" : "none";
    ui.useBtn.textContent = (ui.state.mode === "section" && sectioning) ? "Finish" : "Use this";
  }

  function setMode(mode) {
    ui.state = freshState(mode);
    clearMarks();
    refreshModeButtons();
    promptForMode();
  }

  function freshState(mode) {
    return {
      mode: mode,
      picks: [],
      read: null,
      section: {
        step: "items",
        itemSelector: "",
        container: "",
        itemName: "",
        itemUrl: "",
        resolveItemUrl: false,
        sectionHeaderSelector: "",
      },
    };
  }

  function promptForMode() {
    if (ui.state.mode === "single") setStatus("Click an element to capture its selector.");
    else if (ui.state.mode === "list") setStatus("Click each element to include, then \"Use this\".");
    else setStatus("Section: click 2+ example ITEMS (rows), then \"Next\".");
  }

  function onMove(e) {
    if (!ui) return;
    var el = elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    positionOver(ui.highlight, el);
    ui.highlight.style.display = "block";
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      teardown();
    }
  }

  function itemRootFor(el) {
    var sel = ui.state.section.itemSelector;
    if (!sel) return null;
    try {
      return el.closest(sel);
    }
    catch {
      return null;
    }
  }

  function onClick(e) {
    if (!ui) return;
    var el = elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();

    if (ui.state.mode === "single") {
      handleSinglePick(el);
      return;
    }
    if (ui.state.mode === "list") {
      handleListPick(el);
      return;
    }
    handleSectionPick(el);
  }

  function handleSinglePick(el) {
    var read = defaultRead(el);
    var result = buildRobustSelector(el, document);
    ui.state.read = read;
    ui.state.result = {
      mode: "single",
      selector: result.selector,
      read: read.kind === "text" ? null : read,
      unique: result.unique,
      matchCount: result.matchCount,
      sampleValue: sampleValueFor(result.selector, read, document),
    };
    highlightMatches(result.selector, document);
    setStatus("Selector: <code>" + escapeHtml(result.selector) + "</code><br>Sample: "
      + escapeHtml(ui.state.result.sampleValue || "(empty)")
      + (result.unique ? "" : " &middot; ⚠ matches " + result.matchCount)
      + "<br>Click \"Use this\" or pick another element.");
  }

  function handleListPick(el) {
    if (ui.state.picks.indexOf(el) === -1) ui.state.picks.push(el);
    var exact = buildExactSelector(ui.state.picks, document);
    ui.state.result = {
      mode: "list",
      selector: exact.selector,
      matchCount: exact.matchCount,
    };
    var n = highlightMatches(exact.selector, document);
    setStatus("Selector: <code>" + escapeHtml(exact.selector) + "</code><br>Matches "
      + n + " element(s) — your " + ui.state.picks.length + " selection(s)"
      + (exact.exact ? "" : " &middot; ⚠ also matches others")
      + "<br>Click more elements to add, then \"Use this\".");
  }

  function handleSectionPick(el) {
    var s = ui.state.section;
    if (s.step === "items") {
      ui.state.picks.push(el);
      var common = buildCommonSelector(ui.state.picks, document);
      s.itemSelector = common.selector;
      s.container = common.container || "";
      var n = highlightMatches(s.itemSelector, document);
      setStatus("Item selector: <code>" + escapeHtml(s.itemSelector) + "</code><br>Matches "
        + n + " item(s). Click more example rows to refine, then \"Next\" to pick the name.");
      return;
    }
    var root = itemRootFor(el);
    if (!root) {
      setStatus("Click inside one of the highlighted items.");
      return;
    }
    var rel = buildRelativeSelector(root, el, document);
    if (s.step === "name") {
      s.itemName = rel.selector;
      setStatus("Item name: <code>" + escapeHtml(rel.selector) + "</code> (e.g. \""
        + escapeHtml((el.textContent || "").trim().slice(0, 30)) + "\")<br>\"Next\" to pick the link, or \"Finish\".");
    }
    else if (s.step === "url") {
      s.itemUrl = rel.selector;
      s.resolveItemUrl = true;
      setStatus("Item link: <code>" + escapeHtml(rel.selector) + "</code><br>\"Next\" for a group header, or \"Finish\".");
    }
    else if (s.step === "header") {
      var head = buildRobustSelector(el, document);
      s.sectionHeaderSelector = head.selector;
      setStatus("Group header: <code>" + escapeHtml(head.selector) + "</code><br>Click \"Finish\".");
    }
  }

  function advanceSection() {
    var s = ui.state.section;
    if (s.step === "items") {
      if (!s.itemSelector) {
        setStatus("Pick at least 2 example items first.");
        return;
      }
      s.step = "name";
      clearMarks();
      setStatus("Click the NAME element inside one highlighted item.");
      highlightMatches(s.itemSelector, document);
    }
    else if (s.step === "name") {
      s.step = "url";
      setStatus("Click the LINK element inside one item (or \"Finish\" to skip).");
    }
    else if (s.step === "url") {
      s.step = "header";
      setStatus("Click a GROUP HEADER element (or \"Finish\" to skip).");
    }
    refreshModeButtons();
  }

  function confirmCurrent() {
    if (ui.state.mode === "section") {
      var s = ui.state.section;
      if (!s.itemSelector) {
        setStatus("Pick the example items first.");
        return;
      }
      persistAndClose({
        mode: "section",
        selector: s.itemSelector,
        section: {
          itemSelector: s.itemSelector,
          container: s.container,
          itemName: s.itemName,
          itemUrl: s.itemUrl,
          resolveItemUrl: s.resolveItemUrl,
          sectionHeaderSelector: s.sectionHeaderSelector,
        },
        label: "Sections",
      });
      return;
    }
    if (!ui.state.result || !ui.state.result.selector) {
      setStatus("Pick an element first.");
      return;
    }
    var r = ui.state.result;
    persistAndClose({
      mode: r.mode,
      selector: r.selector,
      read: r.read || null,
      sampleValue: r.sampleValue || "",
      matchCount: r.matchCount,
      label: suggestLabel(r.sampleValue),
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
      }[c];
    });
  }

  function start() {
    if (globalThis.__eesimpleSelectorPickerActive) return;
    globalThis.__eesimpleSelectorPickerActive = true;

    var highlight = box("position:absolute;z-index:2147483645;pointer-events:none;border:2px solid #2563eb;"
      + "background:rgba(37,99,235,0.12);box-sizing:border-box;display:none;");
    document.body.appendChild(highlight);

    var built = buildBar();
    ui = {
      highlight: highlight,
      bar: built.bar,
      status: built.status,
      modeButtons: built.modeButtons,
      useBtn: built.useBtn,
      nextBtn: built.nextBtn,
      marks: [],
      onMove: onMove,
      onClick: onClick,
      onKey: onKey,
      state: freshState("single"),
    };
    document.addEventListener("mousemove", ui.onMove, true);
    document.addEventListener("click", ui.onClick, true);
    document.addEventListener("keydown", ui.onKey, true);
    refreshModeButtons();
    promptForMode();
  }

  globalThis.eesimpleSelectorPicker = {
    start: start,
    teardown: teardown,
    buildRobustSelector: buildRobustSelector,
    buildCommonSelector: buildCommonSelector,
    buildExactSelector: buildExactSelector,
    buildRelativeSelector: buildRelativeSelector,
    classifyClassToken: classifyClassToken,
    sampleValueFor: sampleValueFor,
    STORAGE_KEY: STORAGE_KEY,
  };
})();
