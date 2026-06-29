import { useState } from "react";

import { Bell, X } from "lucide-react";

import { notifySuccess } from "../lib/notifications";
import {
  dismissSharePrompt,
  getNotificationPermission,
  isSharePromptDismissed,
  notificationsSupported,
  requestNotificationPermission,
  shouldShowSharePrompt,
} from "../lib/shareNotifications";

import { Button } from "@/components/ui/button";

/**
 * A small, dismissible banner that asks for notification permission so links shared to the PWA from
 * Android's share sheet can be saved + confirmed with a notification (no app switch). Renders
 * nothing unless notifications are supported, undecided, and not previously dismissed. Shown on the
 * Inbox page, where shared links land.
 */
export function ShareNotificationPrompt() {
  const [visible, setVisible] = useState(() =>
    shouldShowSharePrompt({
      supported: notificationsSupported(),
      permission: getNotificationPermission(),
      dismissed: isSharePromptDismissed(),
    }));

  if (!visible) return null;

  async function enable(): Promise<void> {
    const result = await requestNotificationPermission();
    if (result === "granted") notifySuccess("Share notifications enabled");
    // Granted, denied, or unsupported: either way the prompt is now resolved — hide it.
    setVisible(false);
  }

  function dismiss(): void {
    dismissSharePrompt();
    setVisible(false);
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
      <Bell className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">Save shared links without opening the app</p>
        <p className="text-sm text-muted-foreground">
          Allow notifications and links you share to eeSimple from your phone are saved straight to
          your Inbox with a notification — no need to switch over.
        </p>
        <Button
          size="sm"
          className="mt-1"
          onClick={() => void enable()}
        >
          Enable notifications
        </Button>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="
          shrink-0 rounded-sm p-1 text-muted-foreground
          hover:text-foreground
        "
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
