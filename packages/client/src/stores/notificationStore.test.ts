// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNotificationStore } from "./notificationStore";

import { randomId } from "@/lib/utils";

/** A fixed timestamp so the tests don't depend on the wall clock (the records under test ignore it). */
const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

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
      timestamp: FIXED_TIMESTAMP,
    });

    const {
      notifications,
    } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.id).toBeTruthy();
    expect(notifications[0]!.message).toBe("Saved");
  });

  it("preserves an attached link on the record", () => {
    useNotificationStore.getState().addNotification({
      type: "error",
      message: "Could not fetch a preview image",
      timestamp: FIXED_TIMESTAMP,
      link: {
        label: "File issue",
        href: "https://github.com/example/repo/issues/new?title=oops",
      },
    });

    const {
      notifications,
    } = useNotificationStore.getState();
    expect(notifications[0]!.link).toEqual({
      label: "File issue",
      href: "https://github.com/example/repo/issues/new?title=oops",
    });
  });

  it("preserves the originating page on the record", () => {
    useNotificationStore.getState().addNotification({
      type: "success",
      message: "Updated Title",
      timestamp: FIXED_TIMESTAMP,
      page: {
        pathname: "/categories/dev/edit",
        label: "Categories › Dev › Edit",
      },
    });

    expect(useNotificationStore.getState().notifications[0]!.page).toEqual({
      pathname: "/categories/dev/edit",
      label: "Categories › Dev › Edit",
    });
  });
});

describe("notificationStore unread badge", () => {
  it("increments unreadCount on each added notification", () => {
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    useNotificationStore.getState().addNotification({
      type: "success",
      message: "One",
      timestamp: FIXED_TIMESTAMP,
    });
    useNotificationStore.getState().addNotification({
      type: "success",
      message: "Two",
      timestamp: FIXED_TIMESTAMP,
    });

    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("resets unreadCount when the log is marked seen", () => {
    useNotificationStore.getState().addNotification({
      type: "success",
      message: "One",
      timestamp: FIXED_TIMESTAMP,
    });
    useNotificationStore.getState().markAllSeen();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    // Marking seen keeps the record — only the unread badge clears.
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it("resets unreadCount when the log is cleared", () => {
    useNotificationStore.getState().addNotification({
      type: "success",
      message: "One",
      timestamp: FIXED_TIMESTAMP,
    });
    useNotificationStore.getState().clearNotifications();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
