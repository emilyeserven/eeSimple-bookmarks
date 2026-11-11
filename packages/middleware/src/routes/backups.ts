import type { UpdateBackupSettingsInput } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { BACKUP_DESTINATION_TYPES, BACKUP_FREQUENCIES, BACKUP_SFTP_AUTH_METHODS, MAX_BACKUP_RETENTION } from "@eesimple/types";
import { generateSftpKeyPair, getBackupSettings, updateBackupSettings } from "@/services/backupConfig";
import { assertBackupCanStart, listBackupFiles, runBackup } from "@/services/backupRun";
import { checkBackupDestination, getBackupStatus, rescheduleBackups } from "@/services/backupScheduler";

/** `PUT /api/app-settings/backups` body: a partial patch, so each field can auto-save alone. */
const backupSettingsBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: {
      type: "boolean",
    },
    frequency: {
      type: "string",
      enum: [...BACKUP_FREQUENCIES],
    },
    time: {
      type: "string",
      maxLength: 5,
    },
    weekday: {
      type: "integer",
      minimum: 0,
      maximum: 6,
    },
    timezone: {
      type: "string",
      maxLength: 100,
    },
    retention: {
      type: "integer",
      minimum: 1,
      maximum: MAX_BACKUP_RETENTION,
    },
    includeImages: {
      type: "boolean",
    },
    destinationType: {
      type: "string",
      enum: [...BACKUP_DESTINATION_TYPES],
    },
    sftpHost: {
      type: "string",
      maxLength: 255,
    },
    sftpPort: {
      type: "integer",
      minimum: 1,
      maximum: 65535,
    },
    sftpUsername: {
      type: "string",
      maxLength: 255,
    },
    sftpPath: {
      type: "string",
      maxLength: 1000,
    },
    sftpAuthMethod: {
      type: "string",
      enum: [...BACKUP_SFTP_AUTH_METHODS],
    },
    sftpPassword: {
      type: ["string", "null"],
      maxLength: 1000,
    },
    forgetSftpHost: {
      type: "boolean",
    },
    s3Endpoint: {
      type: "string",
      maxLength: 500,
    },
    s3Region: {
      type: "string",
      maxLength: 100,
    },
    s3Bucket: {
      type: "string",
      maxLength: 255,
    },
    s3Prefix: {
      type: "string",
      maxLength: 500,
    },
    s3AccessKeyId: {
      type: "string",
      maxLength: 500,
    },
    s3SecretAccessKey: {
      type: ["string", "null"],
      maxLength: 1000,
    },
  },
} as const;

/**
 * Scheduled database backups (Settings → Advanced → Backups): the settings pair, SFTP key generation, live status, a
 * "Back up now" trigger (202 + background run + status polling, like the link-health job), the list
 * of stored dumps, and a destination connection check.
 */
export async function backupRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/app-settings/backups", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getBackupSettings());

  app.put("/api/app-settings/backups", {
    schema: {
      tags: ["app-settings"],
      body: backupSettingsBody,
    },
  }, async (req) => {
    const saved = await updateBackupSettings(req.body as UpdateBackupSettingsInput);
    await rescheduleBackups();
    return saved;
  });

  // Create the app's own SSH key pair for SFTP sign-in; the public key comes back in the settings.
  app.post("/api/backups/sftp-key", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => {
    const saved = await generateSftpKeyPair();
    await rescheduleBackups();
    return saved;
  });

  app.get("/api/backups/status", {
    schema: {
      tags: ["maintenance"],
    },
  }, async () => getBackupStatus());

  // Start a backup in the background; the client polls the status until it finishes.
  app.post("/api/backups/run", {
    schema: {
      tags: ["maintenance"],
    },
  }, async (_req, reply) => {
    await assertBackupCanStart();
    void runBackup("manual").catch((err: unknown) => app.log.warn({
      err,
    }, "Manual backup did not start"));
    return reply.code(202).send(await getBackupStatus());
  });

  app.get("/api/backups/files", {
    schema: {
      tags: ["maintenance"],
    },
  }, async () => listBackupFiles());

  app.post("/api/backups/test", {
    schema: {
      tags: ["maintenance"],
    },
  }, async () => checkBackupDestination());
}
