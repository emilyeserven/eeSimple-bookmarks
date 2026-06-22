import { create } from "zustand";
import { persist } from "zustand/middleware";

import { randomId } from "@/lib/utils";

/** Whether a recorded notification reported a success or an error. */
export type NotificationType = "success" | "error";

/**
 * A persistent, clickable link recorded alongside a notification (e.g. a pre-filled "File issue"
 * GitHub URL). Stored as plain data — not a function — so it survives the localStorage round-trip
 * that the transient Sonner `action.onClick` cannot.
 */
export interface NotificationLink {
  label: string;
  href: string;
}

/** One recorded toast: what was shown, its kind, when it fired, and any link to preserve. */
export interface NotificationRecord {
  id: string;
  type: NotificationType;
  message: string;
  /** ISO 8601 timestamp of when the toast fired. */
  timestamp: string;
  /** Optional link preserved from the toast's action (e.g. "File issue"). */
  link?: NotificationLink;
}

/** Keep the log bounded so localStorage doesn't grow without limit. */
const MAX_RECORDS = 100;

interface NotificationState {
  /** Recorded toasts, newest first. */
  notifications: NotificationRecord[];
  /** Record a fired toast. Called by the `notifySuccess`/`notifyError` helpers. */
  addNotification: (record: Omit<NotificationRecord, "id">) => void;
  /** Clear the entire log. */
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    set => ({
      notifications: [],
      addNotification: record => set(state => ({
        notifications: [
          {
            ...record,
            id: randomId(),
          },
          ...state.notifications,
        ].slice(0, MAX_RECORDS),
      })),
      clearNotifications: () => set({
        notifications: [],
      }),
    }),
    {
      name: "eesimple-notifications",
    },
  ),
);
