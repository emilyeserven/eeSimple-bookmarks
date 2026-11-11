import type { BackupRun, BackupStatus } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppLocale } from "../../hooks/useAppLocale";
import { useBackupFiles, useBackupStatus, useRunBackup } from "../../hooks/useBackups";
import { notifyError, notifySuccess } from "../../lib/notifications";
import { formatSize } from "../galleryFormat";

import { Button } from "@/components/ui/button";

function formatWhen(iso: string | null, locale: string): string {
  return iso ? new Date(iso).toLocaleString(locale) : "—";
}

/** Toast when a run finishes while the page is open (the running → finished transition). */
function useBackupCompletionToast(status: BackupStatus | undefined, onFinished: () => void) {
  const {
    t,
  } = useTranslation();
  const wasRunning = useRef(false);
  useEffect(() => {
    if (!status) return;
    if (wasRunning.current && !status.running && status.lastRun) {
      const run = status.lastRun;
      if (run.status === "succeeded") {
        notifySuccess(t("Backup finished ({{size}})", {
          size: formatSize(run.dumpBytes),
        }));
      }
      else {
        notifyError(t("Backup failed: {{error}}", {
          error: run.error ?? "",
        }));
      }
      onFinished();
    }
    wasRunning.current = status.running;
  }, [status, t, onFinished]);
}

function LastRunSummary({
  run,
}: { run: BackupRun }) {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  if (run.status === "running") {
    return (
      <p className="flex items-center gap-1.5 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t("Backing up… started {{when}}", {
          when: formatWhen(run.startedAt, locale),
        })}
      </p>
    );
  }
  const ok = run.status === "succeeded";
  return (
    <div className="space-y-1 text-sm">
      <p
        className={ok
          ? `
            flex items-center gap-1.5 text-green-600
            dark:text-green-400
          `
          : "flex items-center gap-1.5 text-destructive"}
      >
        {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {ok ? t("Last backup succeeded") : t("Last backup failed")}
        {" · "}
        {formatWhen(run.finishedAt, locale)}
        {" · "}
        {run.trigger === "schedule" ? t("scheduled") : t("manual")}
      </p>
      {ok
        ? (
          <p className="text-muted-foreground">
            {t("Dump {{size}}, {{images}} new images copied, {{pruned}} old dumps removed.", {
              size: formatSize(run.dumpBytes),
              images: run.imagesCopied,
              pruned: run.prunedCount,
            })}
          </p>
        )
        : <p className="text-muted-foreground">{run.error}</p>}
    </div>
  );
}

/** Stored dumps at the destination, newest first. */
function BackupFileList() {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  const {
    data,
    isLoading,
  } = useBackupFiles(true);
  if (isLoading) return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;
  if (data?.error) return <p className="text-sm text-destructive">{data.error}</p>;
  if (!data?.files.length) return <p className="text-sm text-muted-foreground">{t("No dumps at the destination yet.")}</p>;
  return (
    <ul className="divide-y rounded-md border text-sm">
      {data.files.map(file => (
        <li
          key={file.key}
          className="
            flex flex-wrap items-center justify-between gap-2 px-3 py-2
          "
        >
          <code className="text-xs break-all">{file.key}</code>
          <span className="text-muted-foreground">
            {formatSize(file.size)}
            {" · "}
            {formatWhen(file.lastModified, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Status of the backup job: pg_dump availability, next scheduled run, the last run's outcome, a
 * "Back up now" button (the run continues on the server; this polls until it finishes and toasts),
 * and the dumps currently stored at the destination.
 */
export function BackupStatusPanel() {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  const {
    data: status,
  } = useBackupStatus();
  const files = useBackupFiles(Boolean(status?.destinationConfigured));
  const run = useRunBackup();
  useBackupCompletionToast(status, () => void files.refetch());

  if (!status) return null;
  const canRun = status.destinationConfigured && Boolean(status.pgDumpVersion) && !status.running;

  return (
    <div className="space-y-4">
      {!status.pgDumpVersion && (
        <p className="text-sm text-destructive">
          {t("pg_dump isn't installed on the server, so backups can't run. The production Docker image includes it; for local development install the PostgreSQL client tools.")}
        </p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t("Next scheduled run")}</dt>
        <dd>{status.nextRunAt ? formatWhen(status.nextRunAt, locale) : t("Not scheduled")}</dd>
        {status.pgDumpVersion && (
          <>
            <dt className="text-muted-foreground">{t("Dump tool")}</dt>
            <dd>
              <code className="text-xs">{status.pgDumpVersion}</code>
            </dd>
          </>
        )}
      </dl>
      {status.lastRun
        ? <LastRunSummary run={status.lastRun} />
        : <p className="text-sm text-muted-foreground">{t("No backups have run yet.")}</p>}
      <Button
        type="button"
        disabled={!canRun || run.isPending}
        onClick={() => run.mutate()}
      >
        {status.running || run.isPending
          ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("Backing up…")}
            </>
          )
          : t("Back up now")}
      </Button>
      {!status.destinationConfigured && (
        <p className="text-xs text-muted-foreground">
          {t("Fill in the destination below to enable backups.")}
        </p>
      )}
      {status.destinationConfigured && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("Stored dumps")}</h4>
          <BackupFileList />
        </div>
      )}
    </div>
  );
}
