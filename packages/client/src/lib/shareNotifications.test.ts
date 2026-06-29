import { beforeEach, describe, expect, it } from "vitest";

import {
  dismissSharePrompt,
  isSharePromptDismissed,
  shouldShowSharePrompt,
} from "./shareNotifications";

describe("shouldShowSharePrompt", () => {
  it("shows only when supported, undecided, and not dismissed", () => {
    expect(
      shouldShowSharePrompt({
        supported: true,
        permission: "default",
        dismissed: false,
      }),
    ).toBe(true);
  });

  it("hides once permission is granted or denied", () => {
    expect(
      shouldShowSharePrompt({
        supported: true,
        permission: "granted",
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowSharePrompt({
        supported: true,
        permission: "denied",
        dismissed: false,
      }),
    ).toBe(false);
  });

  it("hides when unsupported or already dismissed", () => {
    expect(
      shouldShowSharePrompt({
        supported: false,
        permission: "unsupported",
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowSharePrompt({
        supported: true,
        permission: "default",
        dismissed: true,
      }),
    ).toBe(false);
  });
});

describe("share prompt dismissal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips through localStorage", () => {
    expect(isSharePromptDismissed()).toBe(false);
    dismissSharePrompt();
    expect(isSharePromptDismissed()).toBe(true);
  });
});
