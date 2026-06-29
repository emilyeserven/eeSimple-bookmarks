/**
 * Helpers for the "save-to-Inbox" share notifications. When the Android share sheet POSTs a link to
 * the PWA, `public/share-target-sw.js` saves it and fires a notification instead of opening the app
 * — but only if the user has granted notification permission. These helpers drive the small prompt
 * (`ShareNotificationPrompt`) that asks for that permission, and gate it so it never nags.
 */

/** Permission state, plus `"unsupported"` for browsers without Notifications + service workers. */
export type NotificationPermissionState = NotificationPermission | "unsupported";

const DISMISS_KEY = "eesimple-share-notify-dismissed";

/** Notifications are only useful here when both the Notification API and service workers exist. */
export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator
  );
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Whether to surface the "enable save notifications" prompt. Pure (no DOM access) so it can be unit
 * tested: show it only when supported, still undecided, and not previously dismissed.
 */
export function shouldShowSharePrompt(args: {
  supported: boolean;
  permission: NotificationPermissionState;
  dismissed: boolean;
}): boolean {
  return args.supported && args.permission === "default" && !args.dismissed;
}

export function isSharePromptDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  }
  catch {
    return false;
  }
}

export function dismissSharePrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  }
  catch {
    // Private mode / storage disabled — the prompt will simply reappear next visit.
  }
}

/** Ask the browser for notification permission, normalizing failures to the current state. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  }
  catch {
    return Notification.permission;
  }
}
