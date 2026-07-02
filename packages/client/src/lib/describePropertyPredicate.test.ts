// @vitest-environment node
import type { PropertyCondition } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { makeCustomProperty } from "../test-utils/factories";

import { describePropertyPredicate } from "./describePropertyPredicate";

type Predicate = PropertyCondition["predicate"];

describe("describePropertyPredicate", () => {
  describe("number", () => {
    it("describes a both-bounded range", () => {
      const p: Predicate = {
        valueKind: "number",
        predicate: {
          kind: "range",
          min: 1,
          max: 5,
        },
      };
      expect(describePropertyPredicate(p, undefined)).toBe("between 1 and 5");
    });

    it("describes a lower-only and upper-only bound", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: 3,
            max: null,
          },
        },
        undefined,
      )).toBe("at least 3");
      expect(describePropertyPredicate(
        {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: null,
            max: 9,
          },
        },
        undefined,
      )).toBe("at most 9");
    });

    it("falls back to 'any value' when both bounds are null", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: null,
            max: null,
          },
        },
        undefined,
      )).toBe("any value");
    });

    it("describes presence", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "number",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
        undefined,
      )).toBe("has a value");
      expect(describePropertyPredicate(
        {
          valueKind: "number",
          predicate: {
            kind: "presence",
            mode: "missing",
          },
        },
        undefined,
      )).toBe("has no value");
    });
  });

  describe("boolean", () => {
    it("describes the true/false value", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "boolean",
          predicate: {
            kind: "value",
            value: true,
          },
        },
        undefined,
      )).toBe("Yes");
      expect(describePropertyPredicate(
        {
          valueKind: "boolean",
          predicate: {
            kind: "value",
            value: false,
          },
        },
        undefined,
      )).toBe("No");
    });

    it("describes presence", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "boolean",
          predicate: {
            kind: "presence",
            mode: "missing",
          },
        },
        undefined,
      )).toBe("has no value");
    });
  });

  describe("datetime", () => {
    const property = makeCustomProperty({
      type: "datetime",
      dateTimeFormat: "date",
    });

    it("describes a both-bounded range using the raw string when no property is given", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "datetime",
          predicate: {
            kind: "range",
            from: "2024-01-01",
            to: "2024-12-31",
          },
        },
        undefined,
      )).toBe("from 2024-01-01 to 2024-12-31");
    });

    it("describes from-only and to-only bounds", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "datetime",
          predicate: {
            kind: "range",
            from: "2024-01-01",
            to: null,
          },
        },
        property,
      )).toContain("from ");
      expect(describePropertyPredicate(
        {
          valueKind: "datetime",
          predicate: {
            kind: "range",
            from: null,
            to: "2024-12-31",
          },
        },
        property,
      )).toContain("to ");
    });

    it("falls back to 'any value' when both bounds are null", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "datetime",
          predicate: {
            kind: "range",
            from: null,
            to: null,
          },
        },
        property,
      )).toBe("any value");
    });

    it("describes presence", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "datetime",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
        property,
      )).toBe("has a value");
    });
  });

  describe("file", () => {
    it("describes presence only", () => {
      expect(describePropertyPredicate(
        {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
        undefined,
      )).toBe("has a value");
      expect(describePropertyPredicate(
        {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "missing",
          },
        },
        undefined,
      )).toBe("has no value");
    });
  });
});
