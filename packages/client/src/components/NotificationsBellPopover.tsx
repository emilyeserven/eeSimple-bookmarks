import { useState } from "react";

import { Bell, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { useNotificationStore } from "@/stores/notificationStore";

/** Format an ISO timestamp as a human-readable local date + time. */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * The header notifications bell: a persistent log of fired success/error toasts (recorded by the
 * `notifySuccess`/`notifyError` helpers), newest first, opened from a bell button in the app header.
 * A popover on desktop, a modal on small screens (via `ResponsivePopover`). This is the home for the
 * toast-history feature previously reached through the removed right-hand drawer.
 */
export function NotificationsBellPopover() {
  const {
    t,
  } = useTranslation();
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAllSeen = useNotificationStore(state => state.markAllSeen);
  const clearNotifications = useNotificationStore(state => state.clearNotifications);
  const [open, setOpen] = useState(false);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Opening the log means the user has seen the new notifications — clear the unread badge.
        if (next) markAllSeen();
      }}
      title={t("Notifications")}
      description={t("A history of recent toasts.")}
      titleEnd={notifications.length > 0
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearNotifications}
          >
            {t("Clear all")}
          </Button>
        )
        : undefined}
      contentClassName="w-80 max-w-[90vw]"
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Notifications")}
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0
            ? (
              <span
                className="
                  absolute -top-0.5 -right-0.5 flex size-4 items-center
                  justify-center rounded-full border border-border bg-muted
                  text-[10px] leading-none font-medium text-muted-foreground
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )
            : null}
        </Button>
      )}
    >
      {notifications.length === 0
        ? <p className="text-sm text-muted-foreground">{t("No notifications yet.")}</p>
        : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
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
                  {record.page?.label
                    ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {t("From {{page}}", {
                          page: record.page.label,
                        })}
                      </p>
                    )
                    : null}
                  <p className="text-xs text-muted-foreground">{formatTimestamp(record.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
    </ResponsivePopover>
  );
}
