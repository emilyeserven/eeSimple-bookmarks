import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notificationStore";

/** Format an ISO timestamp as a human-readable local date + time. */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * The panel's Notifications view: a persistent log of fired success/error toasts (recorded by the
 * `notifySuccess`/`notifyError` helpers), newest first, with the date/time each one fired.
 */
export function NotificationsPanel() {
  const notifications = useNotificationStore(state => state.notifications);
  const clearNotifications = useNotificationStore(state => state.clearNotifications);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">A history of recent toasts.</p>
        </div>
        {notifications.length > 0
          ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearNotifications}
            >
              Clear all
            </Button>
          )
          : null}
      </div>

      {notifications.length === 0
        ? <p className="text-sm text-muted-foreground">No notifications yet.</p>
        : (
          <ul className="space-y-2">
            {notifications.map(record => (
              <li
                key={record.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                {record.type === "success"
                  ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-green-600"
                    />
                  )
                  : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm wrap-break-word">{record.message}</p>
                  {record.link
                    ? (
                      <a
                        href={record.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center gap-1 text-xs font-medium
                          text-primary
                          hover:underline
                        "
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        {record.link.label}
                      </a>
                    )
                    : null}
                  <p className="text-xs text-muted-foreground">{formatTimestamp(record.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
