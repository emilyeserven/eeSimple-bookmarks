import type { BackupDestinationCheck, BackupDestinationType, BackupSettings } from "@eesimple/types";

import { useState } from "react";

import { CheckCircle2, FileUp, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { S3DestinationForm } from "./S3DestinationForm";
import { SftpDestinationForm } from "./SftpDestinationForm";
import { useAppLocale } from "../../hooks/useAppLocale";
import { useSendBackupTestFile, useTestBackupDestination, useUpdateBackupSettings } from "../../hooks/useBackups";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Inline result of the "Test connection" button. */
function DestinationCheckResult({
  result,
}: { result: BackupDestinationCheck | null }) {
  const {
    t,
  } = useTranslation();
  if (!result) return null;
  if (result.ok) {
    return (
      <span
        className="
          flex items-center gap-1 text-sm text-green-600
          dark:text-green-400
        "
      >
        <CheckCircle2 className="size-4" />
        {t("Connected, and the folder is writable")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-destructive">
      <XCircle className="size-4 shrink-0" />
      {result.error}
    </span>
  );
}

/** Inline result of the "Send test file" button: where hello.txt landed, or why it didn't. */
function TestFileResult({
  result,
}: { result: BackupDestinationCheck | null }) {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  if (!result) return null;
  if (!result.ok) {
    return (
      <span className="flex items-center gap-1 text-sm text-destructive">
        <XCircle className="size-4 shrink-0" />
        {result.error}
      </span>
    );
  }
  return (
    <span
      className="
        flex items-center gap-1 text-sm text-green-600
        dark:text-green-400
      "
    >
      <CheckCircle2 className="size-4 shrink-0" />
      <span>
        {t("Sent at {{time}}:", {
          time: result.sentAt ? new Date(result.sentAt).toLocaleTimeString(locale) : "",
        })}
        {" "}
        <code className="text-xs break-all">{result.location}</code>
      </span>
    </span>
  );
}

/**
 * Where backups go: a folder on another computer over SSH (the default, needs nothing installed),
 * or an S3-compatible bucket. A connection test proves the saved settings work.
 */
export function BackupDestinationForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateBackupSettings();
  const test = useTestBackupDestination();
  const sendFile = useSendBackupTestFile();
  const [checkResult, setCheckResult] = useState<BackupDestinationCheck | null>(null);
  const [fileResult, setFileResult] = useState<BackupDestinationCheck | null>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="backup-destination-type">{t("Send backups to")}</Label>
        <Select
          value={data.destinationType}
          onValueChange={(value) => {
            setCheckResult(null);
            setFileResult(null);
            update.mutate({
              input: {
                destinationType: value as BackupDestinationType,
              },
              successMessage: t("Send backups to"),
            });
          }}
        >
          <SelectTrigger
            id="backup-destination-type"
            className="w-80"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sftp">{t("A folder on another computer (SSH)")}</SelectItem>
            <SelectItem value="s3">{t("An S3 storage server (Garage, MinIO)")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.destinationType === "sftp"
        ? <SftpDestinationForm data={data} />
        : <S3DestinationForm data={data} />}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={test.isPending}
          onClick={() => {
            setCheckResult(null);
            test.mutate(undefined, {
              onSuccess: setCheckResult,
            });
          }}
        >
          {test.isPending
            ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("Checking…")}
              </>
            )
            : t("Test connection")}
        </Button>
        <DestinationCheckResult result={checkResult} />
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sendFile.isPending}
            onClick={() => {
              setFileResult(null);
              sendFile.mutate(undefined, {
                onSuccess: setFileResult,
              });
            }}
          >
            {sendFile.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <FileUp className="size-4" />}
            {t("Send test file")}
          </Button>
          <TestFileResult result={fileResult} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Writes hello.txt containing \"world\" and the time it was sent into the backup folder, so you can open the folder on the other computer and see it arrive. Each send replaces the last one.")}
        </p>
      </div>
    </div>
  );
}
