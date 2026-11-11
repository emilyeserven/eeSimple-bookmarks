import type { UpdateBackupSettingsInput } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { MAX_BACKUP_RETENTION } from "@eesimple/types";
import { getBackupSettings, updateBackupSettings } from "@/services/backupConfig";
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
    schedule: {
      type: "string",
      maxLength: 200,
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
    endpoint: {
      type: "string",
      maxLength: 500,
    },
    region: {
      type: "string",
      maxLength: 100,
    },
    bucket: {
      type: "string",
      maxLength: 255,
    },
    prefix: {
      type: "string",
      maxLength: 500,
    },
    accessKeyId: {
      type: "string",
      maxLength: 500,
    },
    secretAccessKey: {
      type: ["string", "null"],
      maxLength: 1000,
    },
  },
} as const;

/**
 * Scheduled database backups (Settings → Advanced → Backups): the settings pair, live status, a
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
