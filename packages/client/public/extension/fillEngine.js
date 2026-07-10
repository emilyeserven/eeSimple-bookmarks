/*
 * eeSimple Bookmarks — extension fill extraction engine.
 *
 * A classic browser script (no import/export, no chrome APIs) that assigns
 * `globalThis.eesimpleFillEngine`. The popup injects this file into the page with
 * `chrome.scripting.executeScript({ files: ["fillEngine.js"] })` and then calls
 * `eesimpleFillEngine.runRules(rules)` against the live DOM; the jsdom test suite imports it
 * as a side-effect module and calls the same global against fixture HTML.
 *
 * `runRules(rules, doc = document)` returns one `{ ruleId, values, error? }` per input rule, in
 * order. Each rule runs an extraction pipeline: selector -> filters (in order, each narrowing or
 * mapping the candidate set) -> read -> transforms (in order) -> split. The whole per-rule
 * pipeline is wrapped in try/catch so one bad rule (invalid selector/regex) yields an `error`
 * and never poisons the batch. "No candidates matched" is an empty result, not an error.
 */
(function () {
  function trimmedText(el) {
    return (el.textContent || "").trim();
  }

  function elementSiblings(el) {
    var parent = el.parentElement;
    if (!parent) return [];
    return Array.prototype.filter.call(parent.children, function (child) {
      return child !== el;
    });
  }

  function matchesText(text, match) {
    var target = text;
    var value = match.value;
    if (!match.caseSensitive) {
      target = target.toLowerCase();
      value = value.toLowerCase();
    }
    if (match.mode === "equals") return target === value;
    if (match.mode === "contains") return target.indexOf(value) !== -1;
    if (match.mode === "regex") {
      // Build from the raw (un-lowercased) value so char classes stay intact; add `i` when
      // case-insensitive. An invalid pattern throws and surfaces as a per-rule error.
      return new RegExp(match.value, match.caseSensitive ? "" : "i").test(text);
    }
    throw new Error("Unknown text match mode: " + match.mode);
  }

  function ancestorMatches(el, match, maxDepth) {
    var node = el.parentElement;
    var depth = 0;
    var limit = typeof maxDepth === "number" ? maxDepth : Infinity;
    while (node && depth < limit) {
      if (matchesText(trimmedText(node), match)) return true;
      node = node.parentElement;
      depth += 1;
    }
    return false;
  }

  // Narrow (or, for `closest`, map) the candidate set by one filter. Applied in order.
  function applyFilter(candidates, filter) {
    if (filter.kind === "selfText") {
      return candidates.filter(function (el) {
        return matchesText(trimmedText(el), filter.match);
      });
    }
    if (filter.kind === "siblingText") {
      return candidates.filter(function (el) {
        return elementSiblings(el).some(function (sib) {
          return matchesText(trimmedText(sib), filter.match);
        });
      });
    }
    if (filter.kind === "ancestorText") {
      return candidates.filter(function (el) {
        return ancestorMatches(el, filter.match, filter.maxDepth);
      });
    }
    if (filter.kind === "closest") {
      // Map each candidate to its nearest matching ancestor, drop misses, de-duplicate.
      var mapped = [];
      candidates.forEach(function (el) {
        var found = el.closest(filter.selector);
        if (found && mapped.indexOf(found) === -1) mapped.push(found);
      });
      return mapped;
    }
    if (filter.kind === "nth") {
      var index = filter.index < 0 ? candidates.length + filter.index : filter.index;
      return candidates[index] ? [candidates[index]] : [];
    }
    throw new Error("Unknown filter kind: " + filter.kind);
  }

  // Read a raw string from an element. Returns null for a missing attribute so the caller drops it.
  function readValue(el, read) {
    if (!read || read.kind === "text") return trimmedText(el);
    if (read.kind === "attr") {
      var attr = el.getAttribute(read.name);
      return attr == null ? null : attr.trim();
    }
    throw new Error("Unknown read kind: " + read.kind);
  }

  // Seconds per unit (year = 365 d, month = 30 d — calendar-approximate). Keyed by the token's
  // discriminating chars: "mo" for months, otherwise the first letter (y/d/h/m/s).
  var DURATION_UNIT_SECONDS = {
    y: 31536000,
    mo: 2592000,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };
  // `<number><unit>` scanner. The unit alternation lists `mo…` before `m…` so "2mo" is months and
  // "34m" is minutes; each unit accepts its common spellings (h/hr/hour/hours, etc.).
  var DURATION_TOKEN_RE
    = /(\d+(?:\.\d+)?)\s*(y(?:ears?)?|mo(?:nths?)?|d(?:ays?)?|h(?:(?:ou)?rs?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)/gi;

  // Parse a duration string into total seconds; "" when no <number><unit> token is present.
  function parseDurationSeconds(value) {
    var re = new RegExp(DURATION_TOKEN_RE.source, "gi");
    var total = 0;
    var matched = false;
    var m;
    while ((m = re.exec(value)) !== null) {
      var unit = m[2].toLowerCase();
      var key = unit.charAt(0) === "m" && unit.charAt(1) === "o" ? "mo" : unit.charAt(0);
      total += parseFloat(m[1]) * DURATION_UNIT_SECONDS[key];
      matched = true;
    }
    return matched ? String(Math.round(total)) : "";
  }

  // Month name → 1-based number (full names + common abbreviations), lowercased keys.
  var DATE_MONTHS = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    sept: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  };

  // Assemble "YYYY-MM-DD" (day given) or "YYYY-MM"; "" when month/day is out of range.
  function isoDateParts(year, month, day) {
    var m = Number(month);
    if (!(m >= 1 && m <= 12)) return "";
    var out = String(year).padStart(4, "0") + "-" + String(m).padStart(2, "0");
    if (day == null || day === "") return out;
    var d = Number(day);
    if (!(d >= 1 && d <= 31)) return "";
    return out + "-" + String(d).padStart(2, "0");
  }

  // Normalize a human date string to canonical "YYYY-MM-DD" / "YYYY-MM"; "" when unrecognized.
  function parseNormalizedDate(value) {
    var text = value.trim();
    var m;
    // ISO passthrough: YYYY-MM or YYYY-MM-DD.
    m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(text);
    if (m) return isoDateParts(m[1], m[2], m[3]);
    // Numeric year-first: YYYY/MM or YYYY/MM/DD.
    m = /^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/.exec(text);
    if (m) return isoDateParts(m[1], m[2], m[3]);
    // Numeric month-first (US): MM/YYYY or MM/DD/YYYY.
    m = /^(\d{1,2})(?:\/(\d{1,2}))?\/(\d{4})$/.exec(text);
    if (m) return isoDateParts(m[3], m[1], m[2]);
    // Month name + day + year: "June 21, 2026", "Jun 21 2026".
    m = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/.exec(text);
    if (m) return DATE_MONTHS[m[1].toLowerCase()] ? isoDateParts(m[3], DATE_MONTHS[m[1].toLowerCase()], m[2]) : "";
    // Day + month name + year: "21 June 2026", "21st Jun 2026".
    m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(text);
    if (m) return DATE_MONTHS[m[2].toLowerCase()] ? isoDateParts(m[3], DATE_MONTHS[m[2].toLowerCase()], m[1]) : "";
    // Month name + year: "June 2026", "Jun 2026".
    m = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(text);
    if (m) return DATE_MONTHS[m[1].toLowerCase()] ? isoDateParts(m[2], DATE_MONTHS[m[1].toLowerCase()], null) : "";
    return "";
  }

  function applyTransform(value, transform) {
    if (transform.kind === "regex") {
      var re = new RegExp(transform.pattern, transform.flags || "");
      var m = re.exec(value);
      if (!m) return "";
      var group = typeof transform.group === "number" ? transform.group : 0;
      return m[group] == null ? "" : m[group];
    }
    if (transform.kind === "number") {
      var digits = value.replace(/,/g, "").match(/\d+/);
      return digits ? digits[0] : "";
    }
    if (transform.kind === "duration") {
      return parseDurationSeconds(value);
    }
    if (transform.kind === "date") {
      return parseNormalizedDate(value);
    }
    if (transform.kind === "replace") {
      return value.replace(new RegExp(transform.pattern, transform.flags || ""), transform.replacement);
    }
    if (transform.kind === "trim") {
      return value.trim();
    }
    throw new Error("Unknown transform kind: " + transform.kind);
  }

  function runRule(rule, doc) {
    var extract = rule.extract || {};
    var candidates = Array.prototype.slice.call(doc.querySelectorAll(extract.selector));

    (extract.filters || []).forEach(function (filter) {
      candidates = applyFilter(candidates, filter);
    });

    var read = extract.read || {
      kind: "text",
    };
    var values = [];
    candidates.forEach(function (el) {
      var raw = readValue(el, read);
      if (raw != null) values.push(raw);
    });

    (extract.transform || []).forEach(function (transform) {
      values = values.map(function (value) {
        return applyTransform(value, transform);
      });
    });

    if (extract.split) {
      values = values.reduce(function (acc, value) {
        return acc.concat(value.split(extract.split));
      }, []);
    }

    // Trim, drop empties, de-duplicate while preserving order.
    var seen = {};
    var result = [];
    values.forEach(function (value) {
      var trimmed = value.trim();
      if (trimmed && !Object.prototype.hasOwnProperty.call(seen, trimmed)) {
        seen[trimmed] = true;
        result.push(trimmed);
      }
    });
    return result;
  }

  function runRules(rules, doc = document) {
    return (rules || []).map(function (rule) {
      try {
        return {
          ruleId: rule.id,
          values: runRule(rule, doc),
        };
      }
      catch (err) {
        return {
          ruleId: rule.id,
          values: [],
          error: err && err.message ? err.message : String(err),
        };
      }
    });
  }

  globalThis.eesimpleFillEngine = {
    runRules,
  };
})();
