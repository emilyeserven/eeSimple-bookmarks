import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_BACKUP_RETENTION, DEFAULT_BACKUP_SCHEDULE, MAX_BACKUP_RETENTION } from "@eesimple/types";
import {
  applyBackupSettingsPatch,
  DEFAULT_BACKUP_SETTINGS,
  isDestinationComplete,
  isValidBackupSchedule,
  isValidTimezone,
  normalizePrefix,
  normalizeRetention,
  resolveStoredBackupSettings,
} from "@/services/backupConfig";
import { dumpKeyFor, dumpPrefix, imagePrefix, pgEnvFromDatabaseUrl, selectDumpsToPrune } from "@/services/backupRun";
import { describeBackupStoreError } from "@/utils/backupStore";
import { AppError } from "@/utils/errors";

test("isValidBackupSchedule accepts five-field cron and nicknames, refuses seconds and junk", () => {
  for (const ok of ["0 3 * * *", "*/30 * * * *", "0 3 * * 0", "15 2 1 * *", "@daily", "@weekly"]) {
    assert.equal(isValidBackupSchedule(ok), true, ok);
  }
  for (const bad of ["", "   ", "* * * * * *", "0 3 * *", "61 3 * * *", "every day", "0 25 * * *"]) {
    assert.equal(isValidBackupSchedule(bad), false, bad);
  }
});

test("isValidTimezone knows IANA zones and refuses junk", () => {
  assert.equal(isValidTimezone("UTC"), true);
  assert.equal(isValidTimezone("Asia/Tokyo"), true);
  assert.equal(isValidTimezone("America/New_York"), true);
  assert.equal(isValidTimezone(""), false);
  assert.equal(isValidTimezone("Mars/Olympus_Mons"), false);
});

test("normalizeRetention clamps to 1..MAX and falls back on junk", () => {
  assert.equal(normalizeRetention(7), 7);
  assert.equal(normalizeRetention(7.6), 8);
  assert.equal(normalizeRetention(0), 1);
  assert.equal(normalizeRetention(-3), 1);
  assert.equal(normalizeRetention(100_000), MAX_BACKUP_RETENTION);
  assert.equal(normalizeRetention("10"), 10);
  assert.equal(normalizeRetention(null), 1);
  assert.equal(normalizeRetention(undefined), DEFAULT_BACKUP_RETENTION);
  assert.equal(normalizeRetention("abc"), DEFAULT_BACKUP_RETENTION);
});

test("normalizePrefix trims and strips slashes", () => {
  assert.equal(normalizePrefix(" /backups/pi/ "), "backups/pi");
  assert.equal(normalizePrefix("///"), "");
  assert.equal(normalizePrefix("eesimple"), "eesimple");
});

test("resolveStoredBackupSettings fills defaults and repairs junk", () => {
  assert.deepEqual(resolveStoredBackupSettings(null), DEFAULT_BACKUP_SETTINGS);
  const resolved = resolveStoredBackupSettings({
    enabled: "yes" as unknown as boolean,
    retention: -1,
    schedule: "",
    timezone: "  ",
    bucket: "backups",
  });
  assert.equal(resolved.enabled, false);
  assert.equal(resolved.retention, 1);
  assert.equal(resolved.schedule, DEFAULT_BACKUP_SCHEDULE);
  assert.equal(resolved.timezone, "UTC");
  assert.equal(resolved.bucket, "backups");
  assert.equal(resolved.includeImages, true);
});

test("applyBackupSettingsPatch changes only the given fields and normalizes them", () => {
  const next = applyBackupSettingsPatch(DEFAULT_BACKUP_SETTINGS, {
    endpoint: " http://100.101.102.103:3900/ ",
    prefix: "/pi-backups/",
    region: " ",
    retention: 30,
  });
  assert.equal(next.endpoint, "http://100.101.102.103:3900");
  assert.equal(next.prefix, "pi-backups");
  assert.equal(next.region, DEFAULT_BACKUP_SETTINGS.region);
  assert.equal(next.retention, 30);
  assert.equal(next.schedule, DEFAULT_BACKUP_SETTINGS.schedule);
  assert.equal(next.enabled, false);
});

test("applyBackupSettingsPatch rejects an invalid schedule or time zone with a 400", () => {
  assert.throws(
    () => applyBackupSettingsPatch(DEFAULT_BACKUP_SETTINGS, {
      schedule: "* * * * * *",
    }),
    (err: unknown) => err instanceof AppError && err.statusCode === 400,
  );
  assert.throws(
    () => applyBackupSettingsPatch(DEFAULT_BACKUP_SETTINGS, {
      timezone: "Nowhere/Land",
    }),
    (err: unknown) => err instanceof AppError && err.statusCode === 400,
  );
});

test("isDestinationComplete needs endpoint, bucket and both keys", () => {
  const full = {
    endpoint: "http://100.64.0.2:3900",
    region: "garage",
    bucket: "backups",
    prefix: "",
    accessKeyId: "GK123",
    secretAccessKey: "secret",
  };
  assert.equal(isDestinationComplete(full), true);
  for (const field of ["endpoint", "bucket", "accessKeyId", "secretAccessKey"] as const) {
    assert.equal(isDestinationComplete({
      ...full,
      [field]: "",
    }), false, field);
  }
});

test("dump and image prefixes sit under the configured prefix", () => {
  assert.equal(dumpPrefix("pi"), "pi/db/");
  assert.equal(dumpPrefix(""), "db/");
  assert.equal(imagePrefix("pi"), "pi/images/");
  assert.equal(imagePrefix(""), "images/");
});

test("dumpKeyFor builds a sortable, colon-free key", () => {
  assert.equal(
    dumpKeyFor("pi", new Date("2026-11-11T03:00:00.123Z")),
    "pi/db/eesimple-bookmarks-2026-11-11T03-00-00Z.dump",
  );
});

test("selectDumpsToPrune keeps the newest N dumps and ignores other files", () => {
  const keys = [
    "pi/db/eesimple-bookmarks-2026-11-03T03-00-00Z.dump",
    "pi/db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump",
    "pi/db/notes.txt",
    "pi/db/eesimple-bookmarks-2026-11-02T03-00-00Z.dump",
  ];
  assert.deepEqual(selectDumpsToPrune(keys, 2), ["pi/db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump"]);
  assert.deepEqual(selectDumpsToPrune(keys, 5), []);
  // A retention below 1 still keeps the newest dump.
  assert.deepEqual(selectDumpsToPrune(keys, 0), [
    "pi/db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump",
    "pi/db/eesimple-bookmarks-2026-11-02T03-00-00Z.dump",
  ]);
});

test("pgEnvFromDatabaseUrl moves the connection into libpq env vars", () => {
  assert.deepEqual(pgEnvFromDatabaseUrl("postgres://app%40pi:p%40ss@db:5433/book%20marks?sslmode=require"), {
    PGHOST: "db",
    PGPORT: "5433",
    PGDATABASE: "book marks",
    PGAPPNAME: "eesimple-bookmarks-backup",
    PGUSER: "app@pi",
    PGPASSWORD: "p@ss",
    PGSSLMODE: "require",
  });
  assert.equal(pgEnvFromDatabaseUrl("postgres://localhost/bookmarks").PGPORT, "5432");
});

test("describeBackupStoreError maps common failures to actionable text", () => {
  assert.match(describeBackupStoreError({
    code: "ECONNREFUSED",
  }), /Connection refused/);
  assert.match(describeBackupStoreError({
    name: "NotFound",
    $metadata: {
      httpStatusCode: 404,
    },
  }), /Bucket not found/);
  assert.match(describeBackupStoreError({
    name: "Forbidden",
    $metadata: {
      httpStatusCode: 403,
    },
  }), /Access denied/);
  assert.equal(describeBackupStoreError(new Error("boom")), "boom");
});
