import { useTranslation } from "react-i18next";

import { BackupDestinationForm } from "./BackupDestinationForm";
import { BackupScheduleForm } from "./BackupScheduleForm";
import { BackupStatusPanel } from "./BackupStatusPanel";
import { useBackupSettings } from "../../hooks/useBackups";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RESTORE_COMMAND = "pg_restore --clean --if-exists --no-owner --dbname \"$DATABASE_URL\" eesimple-bookmarks-<date>.dump";

/**
 * Settings → Advanced → Backups: scheduled `pg_dump` uploads to an S3-compatible bucket on another
 * machine on the tailnet. Status first (is it working?), then the schedule, then the destination.
 */
export function BackupSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useBackupSettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Status")}</CardTitle>
        </CardHeader>
        <CardContent>
          <BackupStatusPanel />
        </CardContent>
      </Card>
      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("Schedule")}</CardTitle>
              <CardDescription>
                {t("When backups run and how many to keep. Each choice saves on its own.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupScheduleForm data={data} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("Destination")}</CardTitle>
              <CardDescription>
                {t("Another computer on your Tailscale network that keeps the backups.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupDestinationForm data={data} />
            </CardContent>
          </Card>
        </>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("Restoring a backup")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {t("Copy a backup file from the other computer, then load it into the app's database with pg_restore (version 18 or newer, which matches the backup):")}
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
            <code>{RESTORE_COMMAND}</code>
          </pre>
          <p className="text-muted-foreground">
            {t("--clean replaces what is in the database now, so stop the app first. Copied images go back into the image bucket with any S3 tool, for example the AWS CLI's s3 sync.")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
