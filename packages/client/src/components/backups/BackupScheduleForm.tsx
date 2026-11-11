import type { BackupSettings } from "@eesimple/types";

import { useEffect, useState } from "react";

import { MAX_BACKUP_RETENTION } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { backupSchedulePresets, browserTimeZone, CUSTOM_SCHEDULE, presetValueFor } from "./backupSchedulePresets";
import { useUpdateBackupSettings } from "../../hooks/useBackups";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * When and how often: the on/off switch, a cron schedule (presets plus a custom expression), the
 * time zone it runs in, how many dumps to keep, and whether to mirror the image bucket. Each control
 * saves on change/blur with a named toast; the server validates the cron expression and time zone.
 */
export function BackupScheduleForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateBackupSettings();
  const [preset, setPreset] = useState(() => presetValueFor(data.schedule));
  const [schedule, setSchedule] = useState(data.schedule);
  const [timezone, setTimezone] = useState(data.timezone);
  const [retention, setRetention] = useState(String(data.retention));

  useEffect(() => {
    setSchedule(data.schedule);
    setTimezone(data.timezone);
    setRetention(String(data.retention));
    setPreset(current => (current === CUSTOM_SCHEDULE ? current : presetValueFor(data.schedule)));
  }, [data]);

  const browserZone = browserTimeZone();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="backup-enabled"
          checked={data.enabled}
          onCheckedChange={checked => update.mutate({
            input: {
              enabled: checked === true,
            },
            successMessage: t("Scheduled backups"),
          })}
        />
        <Label htmlFor="backup-enabled">{t("Run backups on a schedule")}</Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="backup-preset">{t("Schedule")}</Label>
        <Select
          value={preset}
          onValueChange={(value) => {
            setPreset(value);
            if (value === CUSTOM_SCHEDULE) return;
            setSchedule(value);
            update.mutate({
              input: {
                schedule: value,
              },
              successMessage: t("Schedule"),
            });
          }}
        >
          <SelectTrigger
            id="backup-preset"
            className="w-60"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {backupSchedulePresets().map(p => (
              <SelectItem
                key={p.cron}
                value={p.cron}
              >
                {p.label}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_SCHEDULE}>{t("Custom (cron expression)")}</SelectItem>
          </SelectContent>
        </Select>
        {preset === CUSTOM_SCHEDULE && (
          <>
            <Input
              aria-label={t("Cron expression")}
              className="max-w-60 font-mono"
              placeholder="0 3 * * *"
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              onBlur={() => {
                if (schedule.trim() === data.schedule) return;
                update.mutate({
                  input: {
                    schedule,
                  },
                  successMessage: t("Schedule"),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("Five fields: minute, hour, day of month, month, day of week. See")}
              {" "}
              <a
                href="https://crontab.guru/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                crontab.guru
              </a>
              {" "}
              {t("for help writing one.")}
            </p>
          </>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="backup-timezone">{t("Time zone")}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="backup-timezone"
            className="max-w-60"
            placeholder="UTC"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            onBlur={() => {
              if (timezone.trim() === data.timezone) return;
              update.mutate({
                input: {
                  timezone,
                },
                successMessage: t("Time zone"),
              });
            }}
          />
          {browserZone !== data.timezone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update.mutate({
                input: {
                  timezone: browserZone,
                },
                successMessage: t("Time zone"),
              })}
            >
              {t("Use {{zone}}", {
                zone: browserZone,
              })}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("An IANA time zone name such as Asia/Tokyo. The schedule's hours are read in this zone.")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="backup-retention">{t("Dumps to keep")}</Label>
        <Input
          id="backup-retention"
          type="number"
          min={1}
          max={MAX_BACKUP_RETENTION}
          className="max-w-28"
          value={retention}
          onChange={e => setRetention(e.target.value)}
          onBlur={() => {
            const n = Math.round(Number(retention));
            if (!Number.isFinite(n) || n === data.retention) {
              setRetention(String(data.retention));
              return;
            }
            update.mutate({
              input: {
                retention: Math.min(MAX_BACKUP_RETENTION, Math.max(1, n)),
              },
              successMessage: t("Dumps to keep"),
            });
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t("After each run, older dumps beyond this count are deleted from the destination.")}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="backup-images"
          checked={data.includeImages}
          onCheckedChange={checked => update.mutate({
            input: {
              includeImages: checked === true,
            },
            successMessage: t("Copy images"),
          })}
        />
        <div className="space-y-0.5">
          <Label htmlFor="backup-images">{t("Also copy images")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Copies new files from the image bucket on each run. Files already copied are skipped, and nothing is deleted from the copy.")}
          </p>
        </div>
      </div>
    </div>
  );
}
