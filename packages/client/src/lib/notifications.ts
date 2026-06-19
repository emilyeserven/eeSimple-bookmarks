import type { ExternalToast } from "sonner";

import { toast } from "sonner";

import { useNotificationStore } from "../stores/notificationStore";

/**
 * Fire a success toast AND record it in the Notifications log (right-panel history).
 *
 * Prefer this over a raw `toast.success(...)` for any user-meaningful save/create/delete, so the
 * action is both surfaced immediately and kept in the persistent notification history. Safe to call
 * outside React (e.g. inside a mutation's `onSuccess`) — it writes via the store's static getState.
 * Pass `options` to add an action button or other Sonner extras to the transient toast.
 */
export function notifySuccess(message: string, options?: ExternalToast): void {
  toast.success(message, options);
  useNotificationStore.getState().addNotification({
    type: "success",
    message,
    timestamp: new Date().toISOString(),
  });
}

/** Fire an error toast AND record it in the Notifications log. Mirrors {@link notifySuccess}. */
export function notifyError(message: string, options?: ExternalToast): void {
  toast.error(message, options);
  useNotificationStore.getState().addNotification({
    type: "error",
    message,
    timestamp: new Date().toISOString(),
  });
}
