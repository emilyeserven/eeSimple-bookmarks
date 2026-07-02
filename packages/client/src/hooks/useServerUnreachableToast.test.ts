import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";
import { toast } from "sonner";

import { useServerUnreachableToast } from "./useServerUnreachableToast";

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

function mockFetch(ok: boolean): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
  }));
}

beforeEach(() => {
  vi.mocked(toast.warning).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.dismiss).mockReset();
  setOnline(true);
});

afterEach(() => {
  setOnline(true);
  vi.restoreAllMocks();
});

describe("useServerUnreachableToast", () => {
  it("shows a sticky banner when online but server is unreachable", async () => {
    mockFetch(false);
    renderHook(() => useServerUnreachableToast());

    await vi.waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        "Can't reach the server",
        expect.objectContaining({
          id: "server-unreachable",
          duration: Infinity,
        }),
      );
    });
  });

  it("does not show a banner when server is reachable", async () => {
    mockFetch(true);
    renderHook(() => useServerUnreachableToast());

    await vi.waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
    });
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("does not show a banner when offline (useOfflineToast handles that case)", async () => {
    vi.useFakeTimers();
    try {
      setOnline(false);
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      renderHook(() => useServerUnreachableToast());

      // Flush the mount probe (and one full probe interval) without waiting in real time.
      await vi.advanceTimersByTimeAsync(15_000);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    }
    finally {
      vi.useRealTimers();
    }
  });

  it("dismisses the banner and shows a reconnected toast when the server comes back", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useServerUnreachableToast());

    await vi.waitFor(() => {
      expect(toast.warning).toHaveBeenCalled();
    });

    // Server comes back — fire an online event to trigger an immediate re-probe.
    fetchMock.mockResolvedValue({
      ok: true,
    });
    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => {
      expect(toast.dismiss).toHaveBeenCalledWith("server-unreachable");
      expect(toast.success).toHaveBeenCalledWith(
        "Server reconnected",
        expect.anything(),
      );
    });
  });

  it("does not show a reconnected toast on the first successful probe", async () => {
    mockFetch(true);
    renderHook(() => useServerUnreachableToast());

    await vi.waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.dismiss).not.toHaveBeenCalled();
  });

  it("dismisses the server-unreachable banner when the device goes offline", async () => {
    mockFetch(false);
    renderHook(() => useServerUnreachableToast());

    await vi.waitFor(() => {
      expect(toast.warning).toHaveBeenCalled();
    });

    setOnline(false);
    window.dispatchEvent(new Event("offline"));

    expect(toast.dismiss).toHaveBeenCalledWith("server-unreachable");
  });

  it("stops probing after unmount", async () => {
    vi.useFakeTimers();
    mockFetch(true);
    const {
      unmount,
    } = renderHook(() => useServerUnreachableToast());

    // Let the initial probe settle.
    await vi.advanceTimersByTimeAsync(100);
    const callCountAfterMount = vi.mocked(global.fetch).mock.calls.length;

    unmount();

    // Advance past the probe interval — no new fetch calls should happen.
    await vi.advanceTimersByTimeAsync(15_000);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(callCountAfterMount);

    vi.useRealTimers();
  });
});
