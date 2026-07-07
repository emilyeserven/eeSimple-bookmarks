// @vitest-environment node
import type { TFunction } from "i18next";

import { describe, expect, it, vi } from "vitest";

import { registerBuiltInNameKeys } from "./builtInNameKeys";

function stubT(): TFunction {
  return ((s: string) => s) as TFunction;
}

describe("registerBuiltInNameKeys", () => {
  it("calls t() for every seeded built-in name without throwing", () => {
    const t = vi.fn(stubT());
    expect(() => registerBuiltInNameKeys(t as unknown as TFunction)).not.toThrow();
    expect(t).toHaveBeenCalledTimes(35);
  });

  it("registers no duplicate keys", () => {
    const calls: string[] = [];
    const t = vi.fn((s: string) => {
      calls.push(s);
      return s;
    });
    registerBuiltInNameKeys(t as unknown as TFunction);
    expect(new Set(calls).size).toBe(calls.length);
  });
});
