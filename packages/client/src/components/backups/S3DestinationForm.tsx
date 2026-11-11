import type { BackupTextField } from "./useBackupTextFields";
import type { BackupSettings } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useBackupTextFields } from "./useBackupTextFields";
import i18n from "../../i18n";
import { ApiKeyHint } from "../connectorForms/connectorFormParts";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const S3_FIELDS = ["s3Endpoint", "s3Bucket", "s3Region", "s3Prefix", "s3AccessKeyId"] as const satisfies readonly BackupTextField[];

/** Label (also the toast's field name) and placeholder for each S3 field. */
const s3FieldMeta = (): Record<typeof S3_FIELDS[number], { label: string;
  placeholder: string; }> => ({
  s3Endpoint: {
    label: i18n.t("S3 endpoint"),
    placeholder: "http://100.101.102.103:3900",
  },
  s3Bucket: {
    label: i18n.t("Bucket"),
    placeholder: "bookmarks-backups",
  },
  s3Region: {
    label: i18n.t("Region"),
    placeholder: "garage",
  },
  s3Prefix: {
    label: i18n.t("Folder prefix"),
    placeholder: "eesimple-bookmarks",
  },
  s3AccessKeyId: {
    label: i18n.t("Access key ID"),
    placeholder: "GK…",
  },
});

/** S3-compatible bucket destination (Garage, MinIO). Each field saves on blur; the secret is write-only. */
export function S3DestinationForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const form = useBackupTextFields(data, S3_FIELDS);
  const meta = s3FieldMeta();

  return (
    <div className="space-y-4">
      {S3_FIELDS.map(field => (
        <div
          key={field}
          className="space-y-1.5"
        >
          <Label htmlFor={`backup-${field}`}>{meta[field].label}</Label>
          <Input
            id={`backup-${field}`}
            type={field === "s3Endpoint" ? "url" : "text"}
            placeholder={meta[field].placeholder}
            value={form.values[field]}
            onChange={e => form.setValue(field, e.target.value)}
            onBlur={() => form.saveText(field, meta[field].label)}
          />
          {field === "s3Endpoint" && (
            <p className="text-xs text-muted-foreground">
              {t("The S3 API address of the other computer, using its Tailscale IP or MagicDNS name (Garage listens on port 3900, MinIO on 9000).")}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="backup-s3-secret">{t("Secret access key")}</Label>
        <Input
          id="backup-s3-secret"
          type="password"
          autoComplete="off"
          placeholder={data.s3SecretAccessKeySet ? "••••••••" : t("No key stored")}
          value={form.secrets.s3SecretAccessKey ?? ""}
          onChange={e => form.setSecret("s3SecretAccessKey", e.target.value)}
          onBlur={() => form.saveSecret("s3SecretAccessKey", t("Secret access key"))}
        />
        <ApiKeyHint
          apiKeySet={data.s3SecretAccessKeySet}
          encryptionEnabled={data.encryptionEnabled}
          unsetHint={t("The secret for the access key above. It stays on the server and is never sent back to the browser.")}
        />
      </div>
    </div>
  );
}
