import assert from "node:assert/strict";
import { test } from "node:test";

import { Cron } from "croner";
import { DEFAULT_BACKUP_RETENTION, MAX_BACKUP_RETENTION } from "@eesimple/types";
import {
  applyBackupSettingsPatch,
  type BackupDestination,
  cronFromSchedule,
  DEFAULT_BACKUP_SETTINGS,
  isDestinationComplete,
  isValidTime,
  isValidTimezone,
  normalizePrefix,
  normalizeRetention,
  normalizeSftpPath,
  resolveStoredBackupSettings,
} from "@/services/backupConfig";
import { testFileContents } from "@/services/backupScheduler";
import { dumpPathFor, pgEnvFromDatabaseUrl, selectDumpsToPrune } from "@/services/backupRun";
import { hostKeyFingerprint } from "@/utils/backupSftp";
import { describeBackupStoreError } from "@/utils/backupStore";
import { joinPath } from "@/utils/backupTarget";
import { AppError } from "@/utils/errors";

/** The next `count` run times (UTC ISO) of a cron expression, starting just after `from`. */
function nextRuns(cron: string, from: string, count = 3): string[] {
  return new Cron(cron, {
    timezone: "UTC",
    paused: true,
  }).nextRuns(count, new Date(from)).map(d => d.toISOString());
}

test("cronFromSchedule turns plain choices into the right run times", () => {
  assert.deepEqual(nextRuns(cronFromSchedule("daily", "03:00", 0), "2026-11-11T12:00:00Z"), [
    "2026-11-12T03:00:00.000Z",
    "2026-11-13T03:00:00.000Z",
    "2026-11-14T03:00:00.000Z",
  ]);
  // 2026-11-15 is a Sunday.
  assert.deepEqual(nextRuns(cronFromSchedule("weekly", "04:30", 0), "2026-11-11T12:00:00Z", 2), [
    "2026-11-15T04:30:00.000Z",
    "2026-11-22T04:30:00.000Z",
  ]);
  assert.deepEqual(nextRuns(cronFromSchedule("every12h", "03:15", 0), "2026-11-11T12:00:00Z"), [
    "2026-11-11T15:15:00.000Z",
    "2026-11-12T03:15:00.000Z",
    "2026-11-12T15:15:00.000Z",
  ]);
  assert.deepEqual(nextRuns(cronFromSchedule("every6h", "03:00", 0), "2026-11-11T12:00:00Z"), [
    "2026-11-11T15:00:00.000Z",
    "2026-11-11T21:00:00.000Z",
    "2026-11-12T03:00:00.000Z",
  ]);
  // A junk time falls back to the default 03:00.
  assert.equal(cronFromSchedule("daily", "nope", 0), "0 3 * * *");
});

test("isValidTime accepts HH:MM and refuses junk", () => {
  for (const ok of ["00:00", "3:05", "23:59"]) assert.equal(isValidTime(ok), true, ok);
  for (const bad of ["", "24:00", "12:60", "noon", "12"]) assert.equal(isValidTime(bad), false, bad);
});

test("isValidTimezone knows IANA zones and refuses junk", () => {
  assert.equal(isValidTimezone("UTC"), true);
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
  assert.equal(normalizeRetention(null), DEFAULT_BACKUP_RETENTION);
  assert.equal(normalizeRetention(undefined), DEFAULT_BACKUP_RETENTION);
  assert.equal(normalizeRetention("abc"), DEFAULT_BACKUP_RETENTION);
});

test("path normalizers trim slashes", () => {
  assert.equal(normalizePrefix(" /backups/pi/ "), "backups/pi");
  assert.equal(normalizeSftpPath(" /srv/backups/ "), "/srv/backups");
  assert.equal(normalizeSftpPath("Backups/eesimple/"), "Backups/eesimple");
  assert.equal(normalizeSftpPath("/"), "/");
  assert.equal(joinPath("/srv/backups", "db/x.dump"), "/srv/backups/db/x.dump");
  assert.equal(joinPath("", "db/x.dump"), "db/x.dump");
  assert.equal(joinPath("/", "db/x.dump"), "/db/x.dump");
});

test("resolveStoredBackupSettings fills defaults and repairs junk", () => {
  assert.deepEqual(resolveStoredBackupSettings(null), DEFAULT_BACKUP_SETTINGS);
  const resolved = resolveStoredBackupSettings({
    enabled: "yes" as unknown as boolean,
    retention: -1,
    frequency: "hourly" as never,
    time: "25:00",
    weekday: 9,
    timezone: "Nowhere",
    destinationType: "ftp" as never,
    sftpPort: 0,
    sftpHost: "laptop",
  });
  assert.equal(resolved.enabled, false);
  assert.equal(resolved.retention, 1);
  assert.equal(resolved.frequency, "daily");
  assert.equal(resolved.time, "03:00");
  assert.equal(resolved.weekday, 0);
  assert.equal(resolved.timezone, "UTC");
  assert.equal(resolved.destinationType, "sftp");
  assert.equal(resolved.sftpPort, 22);
  assert.equal(resolved.sftpHost, "laptop");
});

test("applyBackupSettingsPatch changes only the given fields and normalizes them", () => {
  const next = applyBackupSettingsPatch(DEFAULT_BACKUP_SETTINGS, {
    s3Endpoint: " http://100.101.102.103:3900/ ",
    s3Prefix: "/pi-backups/",
    s3Region: " ",
    sftpPath: "Backups/eesimple/",
    time: "4:30",
    retention: 30,
  });
  assert.equal(next.s3Endpoint, "http://100.101.102.103:3900");
  assert.equal(next.s3Prefix, "pi-backups");
  assert.equal(next.s3Region, DEFAULT_BACKUP_SETTINGS.s3Region);
  assert.equal(next.sftpPath, "Backups/eesimple");
  assert.equal(next.time, "04:30");
  assert.equal(next.retention, 30);
  assert.equal(next.frequency, DEFAULT_BACKUP_SETTINGS.frequency);
  assert.equal(next.enabled, false);
});

test("applyBackupSettingsPatch forgets the host fingerprint only when the host or port changes", () => {
  const trusted = {
    ...DEFAULT_BACKUP_SETTINGS,
    sftpHost: "laptop",
    sftpHostFingerprint: "SHA256:abc",
  };
  assert.equal(applyBackupSettingsPatch(trusted, {
    sftpHost: " laptop ",
    sftpUsername: "emily",
  }).sftpHostFingerprint, "SHA256:abc");
  assert.equal(applyBackupSettingsPatch(trusted, {
    sftpHost: "desktop",
  }).sftpHostFingerprint, "");
  assert.equal(applyBackupSettingsPatch(trusted, {
    sftpPort: 2222,
  }).sftpHostFingerprint, "");
  assert.equal(applyBackupSettingsPatch(trusted, {
    forgetSftpHost: true,
  }).sftpHostFingerprint, "");
});

test("applyBackupSettingsPatch rejects an invalid time or time zone with a 400", () => {
  for (const input of [{
    time: "25:00",
  }, {
    timezone: "Nowhere/Land",
  }]) {
    assert.throws(
      () => applyBackupSettingsPatch(DEFAULT_BACKUP_SETTINGS, input),
      (err: unknown) => err instanceof AppError && err.statusCode === 400,
    );
  }
});

test("isDestinationComplete checks the fields each destination needs", () => {
  const s3: BackupDestination = {
    type: "s3",
    endpoint: "http://100.64.0.2:3900",
    region: "garage",
    bucket: "backups",
    prefix: "",
    accessKeyId: "GK123",
    secretAccessKey: "secret",
  };
  assert.equal(isDestinationComplete(s3), true);
  assert.equal(isDestinationComplete({
    ...s3,
    bucket: "",
  }), false);
  const sftp: BackupDestination = {
    type: "sftp",
    host: "laptop",
    port: 22,
    username: "emily",
    path: "",
    password: "pw",
    privateKey: null,
    hostFingerprint: "",
  };
  assert.equal(isDestinationComplete(sftp), true);
  assert.equal(isDestinationComplete({
    ...sftp,
    password: null,
  }), false);
  assert.equal(isDestinationComplete({
    ...sftp,
    password: null,
    privateKey: "-----BEGIN OPENSSH PRIVATE KEY-----",
  }), true);
});

test("dumpPathFor builds a sortable, colon-free name", () => {
  assert.equal(dumpPathFor(new Date("2026-11-11T03:00:00.123Z")), "db/eesimple-bookmarks-2026-11-11T03-00-00Z.dump");
});

test("selectDumpsToPrune keeps the newest N dumps and ignores other files", () => {
  const keys = [
    "db/eesimple-bookmarks-2026-11-03T03-00-00Z.dump",
    "db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump",
    "db/notes.txt",
    "db/eesimple-bookmarks-2026-11-04T03-00-00Z.dump.partial",
    "db/eesimple-bookmarks-2026-11-02T03-00-00Z.dump",
  ];
  assert.deepEqual(selectDumpsToPrune(keys, 2), ["db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump"]);
  assert.deepEqual(selectDumpsToPrune(keys, 5), []);
  // A retention below 1 still keeps the newest dump.
  assert.deepEqual(selectDumpsToPrune(keys, 0), [
    "db/eesimple-bookmarks-2026-11-01T03-00-00Z.dump",
    "db/eesimple-bookmarks-2026-11-02T03-00-00Z.dump",
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

test("hostKeyFingerprint matches ssh-keygen's SHA256 format", () => {
  assert.equal(hostKeyFingerprint(Buffer.from("key")), "SHA256:LHDhK3oGRvkiefQnx7OOczTY5Tic/xZ6HcMOc/gmtoM");
});

test("describeBackupStoreError maps common failures to actionable text", () => {
  assert.match(describeBackupStoreError({
    code: "ECONNREFUSED",
  }), /Connection refused/);
  assert.match(describeBackupStoreError({
    level: "client-authentication",
    message: "All configured authentication methods failed",
  }), /Sign-in failed/);
  assert.match(describeBackupStoreError(new Error("Timed out while waiting for handshake")), /Timed out/);
  assert.match(describeBackupStoreError({
    name: "NotFound",
    $metadata: {
      httpStatusCode: 404,
    },
  }), /Bucket not found/);
  assert.equal(describeBackupStoreError(new Error("boom")), "boom");
});

test("the test file says world, then when it was sent", () => {
  assert.equal(
    testFileContents(new Date("2026-11-11T20:31:06.000Z")),
    "world\nSent by eeSimple Bookmarks at 2026-11-11T20:31:06.000Z\n",
  );
});
