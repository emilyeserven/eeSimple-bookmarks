import type { BackupFrequency, BackupSettings, UpdateBackupSettingsInput } from "@eesimple/types";

import { useEffect, useState } from "react";

import { MAX_BACKUP_RETENTION } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { backupFrequencyOptions, browserTimeZone, weekdayOptions } from "./backupScheduleOptions";
import { useAppLocale } from "../../hooks/useAppLocale";
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
 * When and how often, as plain choices: on/off, how often, which day (weekly), what time, how many
 * backups to keep, and whether to copy images. The server turns these into its own schedule, so
 * there is no cron syntax to learn. Every schedule save also sends the browser's time zone, so the
 * time means the user's local time. Each control saves on change/blur with a named toast.
 */
export function BackupScheduleForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  const update = useUpdateBackupSettings();
  const [time, setTime] = useState(data.time);
  const [retention, setRetention] = useState(String(data.retention));
  const zone = browserTimeZone();

  useEffect(() => {
    setTime(data.time);
    setRetention(String(data.retention));
  }, [data]);

  function saveSchedule(input: UpdateBackupSettingsInput, label: string): void {
    update.mutate({
      input: {
        ...input,
        timezone: zone,
      },
      successMessage: label,
    });
  }

  const everyFewHours = data.frequency === "every12h" || data.frequency === "every6h";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="backup-enabled"
          checked={data.enabled}
          onCheckedChange={checked => saveSchedule({
            enabled: checked === true,
          }, t("Automatic backups"))}
        />
        <Label htmlFor="backup-enabled">{t("Back up automatically")}</Label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="backup-frequency">{t("How often")}</Label>
          <Select
            value={data.frequency}
            onValueChange={value => saveSchedule({
              frequency: value as BackupFrequency,
            }, t("How often"))}
          >
            <SelectTrigger
              id="backup-frequency"
              className="w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {backupFrequencyOptions().map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data.frequency === "weekly" && (
          <div className="space-y-1.5">
            <Label htmlFor="backup-weekday">{t("On")}</Label>
            <Select
              value={String(data.weekday)}
              onValueChange={value => saveSchedule({
                weekday: Number(value),
              }, t("Backup day"))}
            >
              <SelectTrigger
                id="backup-weekday"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekdayOptions(locale).map(option => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="backup-time">{everyFewHours ? t("Starting at") : t("At")}</Label>
          <Input
            id="backup-time"
            type="time"
            className="w-32"
            value={time}
            onChange={e => setTime(e.target.value)}
            onBlur={() => {
              if (!time || (time === data.time && zone === data.timezone)) return;
              saveSchedule({
                time,
              }, t("Backup time"));
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Times are in your time zone ({{zone}}).", {
          zone,
        })}
        {data.timezone !== zone && (
          <>
            {" "}
            {t("The saved schedule uses {{saved}}.", {
              saved: data.timezone,
            })}
            {" "}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => saveSchedule({}, t("Time zone"))}
            >
              {t("Switch to {{zone}}", {
                zone,
              })}
            </Button>
          </>
        )}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="backup-retention">{t("Backups to keep")}</Label>
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
            if (!retention || !Number.isFinite(n) || n === data.retention) {
              setRetention(String(data.retention));
              return;
            }
            update.mutate({
              input: {
                retention: Math.min(MAX_BACKUP_RETENTION, Math.max(1, n)),
              },
              successMessage: t("Backups to keep"),
            });
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t("After each backup, the oldest ones beyond this number are deleted from the other computer.")}
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
            {t("Copies new bookmark images on each backup. Images already copied are skipped, and nothing is deleted from the copy.")}
          </p>
        </div>
      </div>
    </div>
  );
}
