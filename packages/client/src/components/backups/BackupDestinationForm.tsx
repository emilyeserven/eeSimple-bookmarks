import type { BackupDestinationCheck, BackupDestinationType, BackupSettings } from "@eesimple/types";

import { useState } from "react";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { S3DestinationForm } from "./S3DestinationForm";
import { SftpDestinationForm } from "./SftpDestinationForm";
import { useTestBackupDestination, useUpdateBackupSettings } from "../../hooks/useBackups";

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
  const [checkResult, setCheckResult] = useState<BackupDestinationCheck | null>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="backup-destination-type">{t("Send backups to")}</Label>
        <Select
          value={data.destinationType}
          onValueChange={(value) => {
            setCheckResult(null);
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
    </div>
  );
}
