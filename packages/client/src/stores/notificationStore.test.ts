import { afterEach, describe, expect, it, vi } from "vitest";

import { useNotificationStore } from "./notificationStore";

import { randomId } from "@/lib/utils";

afterEach(() => {
  vi.unstubAllGlobals();
  useNotificationStore.getState().clearNotifications();
});

describe("randomId", () => {
  it("returns distinct values across calls", () => {
    const ids = new Set([randomId(), randomId(), randomId()]);
    expect(ids.size).toBe(3);
  });

  it("works on insecure origins where crypto.randomUUID is unavailable", () => {
    // `crypto.randomUUID` is undefined in insecure contexts (plain HTTP, non-localhost).
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    const id = randomId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("notificationStore.addNotification", () => {
  it("records a notification even when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });

    useNotificationStore.getState().addNotification({
      type: "success",
      message: "Saved",
      timestamp: new Date().toISOString(),
    });

    const {
      notifications,
    } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.id).toBeTruthy();
    expect(notifications[0]!.message).toBe("Saved");
  });
});
