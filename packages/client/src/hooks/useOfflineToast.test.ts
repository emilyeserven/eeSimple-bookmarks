import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";
import { toast } from "sonner";

import { useOfflineToast } from "./useOfflineToast";

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

/** Flip `navigator.onLine` for the duration of a test. */
function setOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  vi.mocked(toast.warning).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.dismiss).mockReset();
  setOnline(true);
});

afterEach(() => {
  setOnline(true);
});

describe("useOfflineToast", () => {
  it("shows a sticky offline banner when an offline event fires", () => {
    renderHook(() => useOfflineToast());
    expect(toast.warning).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("offline"));

    expect(toast.warning).toHaveBeenCalledWith(
      "You're offline",
      expect.objectContaining({
        id: "app-offline",
        duration: Infinity,
      }),
    );
  });

  it("shows the banner immediately when mounted while already offline", () => {
    setOnline(false);
    renderHook(() => useOfflineToast());
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it("does not show the banner when mounted online", () => {
    renderHook(() => useOfflineToast());
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("dismisses the banner and confirms reconnection on an online event", () => {
    renderHook(() => useOfflineToast());

    window.dispatchEvent(new Event("online"));

    expect(toast.dismiss).toHaveBeenCalledWith("app-offline");
    expect(toast.success).toHaveBeenCalledWith("Back online", expect.anything());
  });

  it("stops listening after unmount", () => {
    const {
      unmount,
    } = renderHook(() => useOfflineToast());
    unmount();

    window.dispatchEvent(new Event("offline"));

    expect(toast.warning).not.toHaveBeenCalled();
  });
});
