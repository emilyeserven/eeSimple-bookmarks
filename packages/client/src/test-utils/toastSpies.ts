import type { NotifyOptions } from "../lib/notifications";

import { vi } from "vitest";

/**
 * The single shared seam for mocking the toast stack in tests.
 *
 * Mock at the **middle** layer — `lib/notifications` (`notifySuccess` / `notifyError`) — not at
 * `lib/autoSave` above it (its real field-toast wording then stays under test) and not at `sonner`
 * below it (only tests OF the toast layer itself mock sonner). Because `vi.mock` factories are
 * hoisted, a test file adopts this seam with the documented redirect-to-module form:
 *
 * ```ts
 * import { notifyError, notifySuccess } from "../test-utils/toastSpies";
 *
 * vi.mock("../lib/notifications", async () => await import("../test-utils/toastSpies"));
 * ```
 *
 * …then asserts on the spies (`expect(notifySuccess).toHaveBeenCalledWith("Updated Name")`).
 * Field auto-save wording comes from the real `lib/autoSave`: "Updated <label>" on success and
 * "Couldn't save <label>: <cause>" on failure. Reset between tests with {@link resetToastSpies}
 * (or `vi.clearAllMocks()`).
 *
 * Where a test only needs "a toast fired and was recorded", prefer asserting on the real
 * `notificationStore` mock-free instead — a mock-free file rides the fast non-isolated project.
 */

/** Spy standing in for `lib/notifications`' `notifySuccess`. */
export const notifySuccess = vi.fn<(message: string, options?: NotifyOptions) => void>();

/** Spy standing in for `lib/notifications`' `notifyError`. */
export const notifyError = vi.fn<(message: string, options?: NotifyOptions) => void>();

/** Clear both toast spies (call from `beforeEach`). */
export function resetToastSpies(): void {
  notifySuccess.mockReset();
  notifyError.mockReset();
}
