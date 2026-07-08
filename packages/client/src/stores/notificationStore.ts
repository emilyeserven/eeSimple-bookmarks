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

/** The page a notification was generated from — the raw pathname plus a human-readable label. */
export interface NotificationPage {
  pathname: string;
  label: string;
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
  /** The page the toast was fired from, for context in the log. */
  page?: NotificationPage;
}

/** Keep the log bounded so localStorage doesn't grow without limit. */
const MAX_RECORDS = 100;

interface NotificationState {
  /** Recorded toasts, newest first. */
  notifications: NotificationRecord[];
  /** Count of notifications arrived since the log was last opened (drives the bell badge). */
  unreadCount: number;
  /** Record a fired toast. Called by the `notifySuccess`/`notifyError` helpers. */
  addNotification: (record: Omit<NotificationRecord, "id">) => void;
  /** Mark every notification as seen — resets the unread badge (called when the popover opens). */
  markAllSeen: () => void;
  /** Clear the entire log. */
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    set => ({
      notifications: [],
      unreadCount: 0,
      addNotification: record => set(state => ({
        notifications: [
          {
            ...record,
            id: randomId(),
          },
          ...state.notifications,
        ].slice(0, MAX_RECORDS),
        unreadCount: state.unreadCount + 1,
      })),
      markAllSeen: () => set({
        unreadCount: 0,
      }),
      clearNotifications: () => set({
        notifications: [],
        unreadCount: 0,
      }),
    }),
    {
      name: "eesimple-notifications",
    },
  ),
);
