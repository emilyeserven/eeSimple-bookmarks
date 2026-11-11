import type { BackupDestinationCheck, BackupSettings, UpdateBackupSettingsInput } from "@eesimple/types";

import { useEffect, useState } from "react";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTestBackupDestination, useUpdateBackupSettings } from "../../hooks/useBackups";
import i18n from "../../i18n";
import { ApiKeyHint } from "../connectorForms/connectorFormParts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The plain-text destination fields, each saved on blur. */
type TextField = "endpoint" | "region" | "bucket" | "prefix" | "accessKeyId";

/** Label (also the toast's field name) and placeholder for each text field. */
const textFields = (): {
  field: TextField;
  label: string;
  placeholder: string;
}[] => [
  {
    field: "endpoint",
    label: i18n.t("S3 endpoint"),
    placeholder: "http://100.101.102.103:3900",
  },
  {
    field: "bucket",
    label: i18n.t("Bucket"),
    placeholder: "bookmarks-backups",
  },
  {
    field: "region",
    label: i18n.t("Region"),
    placeholder: "garage",
  },
  {
    field: "prefix",
    label: i18n.t("Folder prefix"),
    placeholder: "eesimple-bookmarks",
  },
  {
    field: "accessKeyId",
    label: i18n.t("Access key ID"),
    placeholder: "GK…",
  },
];

function pickText(data: BackupSettings): Record<TextField, string> {
  return {
    endpoint: data.endpoint,
    region: data.region,
    bucket: data.bucket,
    prefix: data.prefix,
    accessKeyId: data.accessKeyId,
  };
}

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
        {t("Bucket reachable")}
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
 * Where dumps go: an S3-compatible bucket on another machine on the tailnet. Each field saves on
 * blur with a toast naming it; the secret key is write-only (only `secretAccessKeySet` comes back).
 */
export function BackupDestinationForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateBackupSettings();
  const test = useTestBackupDestination();
  const [values, setValues] = useState(() => pickText(data));
  const [secret, setSecret] = useState("");
  const [secretDirty, setSecretDirty] = useState(false);
  const [checkResult, setCheckResult] = useState<BackupDestinationCheck | null>(null);

  useEffect(() => {
    setValues(pickText(data));
  }, [data]);

  function save(input: UpdateBackupSettingsInput, label: string, onSaved?: () => void): void {
    setCheckResult(null);
    update.mutate({
      input,
      successMessage: label,
    }, {
      onSuccess: onSaved,
    });
  }

  function saveText(field: TextField, label: string): void {
    if (values[field] === data[field]) return;
    save({
      [field]: values[field],
    }, label);
  }

  function saveSecret(): void {
    if (!secretDirty) return;
    save({
      secretAccessKey: secret,
    }, t("Secret access key"), () => {
      setSecret("");
      setSecretDirty(false);
    });
  }

  return (
    <div className="space-y-4">
      {textFields().map(({
        field, label, placeholder,
      }) => (
        <div
          key={field}
          className="space-y-1.5"
        >
          <Label htmlFor={`backup-${field}`}>{label}</Label>
          <Input
            id={`backup-${field}`}
            type={field === "endpoint" ? "url" : "text"}
            placeholder={placeholder}
            value={values[field]}
            onChange={e => setValues(v => ({
              ...v,
              [field]: e.target.value,
            }))}
            onBlur={() => saveText(field, label)}
          />
          {field === "endpoint" && (
            <p className="text-xs text-muted-foreground">
              {t("The S3 API address of the other machine, using its Tailscale IP or MagicDNS name (Garage listens on port 3900, MinIO on 9000).")}
            </p>
          )}
          {field === "prefix" && (
            <p className="text-xs text-muted-foreground">
              {t("Dumps are stored under {{dbPath}} and images under {{imagePath}}.", {
                dbPath: `${values.prefix ? `${values.prefix}/` : ""}db/`,
                imagePath: `${values.prefix ? `${values.prefix}/` : ""}images/`,
              })}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="backup-secret">{t("Secret access key")}</Label>
        <Input
          id="backup-secret"
          type="password"
          autoComplete="off"
          placeholder={data.secretAccessKeySet ? "••••••••" : t("No key stored")}
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            setSecretDirty(true);
          }}
          onBlur={saveSecret}
        />
        <ApiKeyHint
          apiKeySet={data.secretAccessKeySet}
          encryptionEnabled={data.encryptionEnabled}
          unsetHint={t("The secret for the access key above. It stays on the server and is never sent back to the browser.")}
        />
      </div>
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
