// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import { setCurrentNotificationPage } from "./notificationPage";
import { notifyError, notifySuccess } from "./notifications";

import { useNotificationStore } from "@/stores/notificationStore";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  useNotificationStore.getState().clearNotifications();
});

afterEach(() => {
  useNotificationStore.getState().clearNotifications();
});

describe("notifyError / notifySuccess", () => {
  it("records the message in the notifications log", () => {
    notifyError("Could not save");
    const [record] = useNotificationStore.getState().notifications;
    expect(record).toMatchObject({
      type: "error",
      message: "Could not save",
    });
  });

  it("preserves a link in the recorded notification", () => {
    notifyError("Could not fetch a preview image", {
      link: {
        label: "File issue",
        href: "https://github.com/example/repo/issues/new",
      },
    });
    const [record] = useNotificationStore.getState().notifications;
    expect(record!.link).toEqual({
      label: "File issue",
      href: "https://github.com/example/repo/issues/new",
    });
  });

  it("synthesizes a Sonner action button from the link", () => {
    notifySuccess("Saved", {
      link: {
        label: "Open",
        href: "https://example.com",
      },
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      "Saved",
      expect.objectContaining({
        action: expect.objectContaining({
          label: "Open",
        }),
      }),
    );
  });

  it("does not pass the link through as a Sonner option", () => {
    notifyError("Boom", {
      link: {
        label: "Open",
        href: "https://example.com",
      },
    });
    const options = vi.mocked(toast.error).mock.calls[0]![1];
    expect(options).not.toHaveProperty("link");
  });

  it("records the page the toast was fired from", () => {
    setCurrentNotificationPage({
      pathname: "/categories/dev/edit",
      label: "Categories › Dev › Edit",
    });
    notifySuccess("Updated Title");
    const [record] = useNotificationStore.getState().notifications;
    expect(record!.page).toEqual({
      pathname: "/categories/dev/edit",
      label: "Categories › Dev › Edit",
    });
  });

  it("falls back to a pathname-derived page label when no rich label is set", () => {
    setCurrentNotificationPage({
      pathname: "/settings/display/general",
      label: "",
    });
    notifySuccess("Saved");
    const [record] = useNotificationStore.getState().notifications;
    expect(record!.page?.label).toBe("Settings › Display › General");
  });
});
