import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Whether a recorded notification reported a success or an error. */
export type NotificationType = "success" | "error";

/** One recorded toast: what was shown, its kind, and when it fired. */
export interface NotificationRecord {
  id: string;
  type: NotificationType;
  message: string;
  /** ISO 8601 timestamp of when the toast fired. */
  timestamp: string;
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
            id: crypto.randomUUID(),
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
