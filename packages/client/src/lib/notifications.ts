import type { NotificationLink } from "../stores/notificationStore";
import type { ExternalToast } from "sonner";

import { toast } from "sonner";

import { getCurrentNotificationPage } from "./notificationPage";
import { useNotificationStore } from "../stores/notificationStore";

/**
 * Options for the {@link notifySuccess}/{@link notifyError} helpers: Sonner's transient-toast extras
 * plus an optional `link` that is BOTH surfaced as the toast's action button AND persisted in the
 * Notifications log. Prefer `link` over a raw `action` when the action just opens a URL — only `link`
 * survives into the persistent history (a Sonner `action.onClick` does not serialize).
 */
export interface NotifyOptions extends ExternalToast {
  link?: NotificationLink;
}

/** Build the Sonner toast args from our options: derive an `action` from `link` when none was given. */
function toToastArgs(options?: NotifyOptions): ExternalToast | undefined {
  if (!options) return undefined;
  const {
    link, ...rest
  } = options;
  if (!link || rest.action) return rest;
  return {
    ...rest,
    action: {
      label: link.label,
      onClick: () => window.open(link.href, "_blank", "noopener,noreferrer"),
    },
  };
}

/**
 * Fire a success toast AND record it in the Notifications log (right-panel history).
 *
 * Prefer this over a raw `toast.success(...)` for any user-meaningful save/create/delete, so the
 * action is both surfaced immediately and kept in the persistent notification history. Safe to call
 * outside React (e.g. inside a mutation's `onSuccess`) — it writes via the store's static getState.
 * Pass `options` to add an action button or a persistent `link` to the toast.
 */
export function notifySuccess(message: string, options?: NotifyOptions): void {
  toast.success(message, toToastArgs(options));
  useNotificationStore.getState().addNotification({
    type: "success",
    message,
    timestamp: new Date().toISOString(),
    link: options?.link,
    page: getCurrentNotificationPage(),
  });
}

/** Fire an error toast AND record it in the Notifications log. Mirrors {@link notifySuccess}. */
export function notifyError(message: string, options?: NotifyOptions): void {
  toast.error(message, toToastArgs(options));
  useNotificationStore.getState().addNotification({
    type: "error",
    message,
    timestamp: new Date().toISOString(),
    link: options?.link,
    page: getCurrentNotificationPage(),
  });
}
