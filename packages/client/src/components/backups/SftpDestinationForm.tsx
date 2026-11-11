import type { BackupSftpAuthMethod, BackupSettings } from "@eesimple/types";

import { useEffect, useState } from "react";

import { Copy, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SshSetupHelp } from "./SshSetupHelp";
import { useBackupTextFields } from "./useBackupTextFields";
import { useGenerateSftpKey } from "../../hooks/useBackups";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyText } from "@/lib/clipboard";
import { notifySuccess } from "@/lib/notifications";

const SFTP_FIELDS = ["sftpHost", "sftpUsername", "sftpPath"] as const;

/** The app's public key with a copy button and where to paste it. */
function PublicKeyPanel({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const generate = useGenerateSftpKey();
  if (!data.sftpPublicKey) {
    return (
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          <KeyRound className="size-4" />
          {t("Create a key for this app")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("The app makes its own key pair and keeps the private half on the server. You then paste the public half into the other computer once.")}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-2 text-xs">{data.sftpPublicKey}</pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copyText(data.sftpPublicKey).then(() => notifySuccess(t("Copied the public key")))}
        >
          <Copy className="size-4" />
          {t("Copy")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Add this line to the file ~/.ssh/authorized_keys of the user above on the other computer (create the file if it doesn't exist). On Windows administrator accounts it goes in C:\\ProgramData\\ssh\\administrators_authorized_keys instead.")}
      </p>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        disabled={generate.isPending}
        onClick={() => generate.mutate()}
      >
        {t("Replace with a new key")}
      </Button>
    </div>
  );
}

/** The remembered host fingerprint and a "Trust again" reset. */
function HostIdentity({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const form = useBackupTextFields(data, []);
  if (!data.sftpHostFingerprint) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("The computer's identity is remembered on the first successful connection and checked every time after, so nothing else can pretend to be it.")}
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">
      {t("Trusted identity:")}
      {" "}
      <code>{data.sftpHostFingerprint}</code>
      {" "}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        onClick={() => form.save({
          forgetSftpHost: true,
        }, t("Trusted identity"))}
      >
        {t("Trust again")}
      </Button>
    </p>
  );
}

/**
 * SFTP destination: a folder on another computer with SSH turned on, signed in with a password or
 * the app's own key. Each field saves on blur; the password is write-only.
 */
export function SftpDestinationForm({
  data,
}: { data: BackupSettings }) {
  const {
    t,
  } = useTranslation();
  const form = useBackupTextFields(data, SFTP_FIELDS);
  const [port, setPort] = useState(String(data.sftpPort));
  useEffect(() => setPort(String(data.sftpPort)), [data.sftpPort]);

  return (
    <div className="space-y-4">
      <SshSetupHelp />
      <div className="flex flex-wrap gap-3">
        <div className="min-w-60 flex-1 space-y-1.5">
          <Label htmlFor="backup-sftpHost">{t("Computer address")}</Label>
          <Input
            id="backup-sftpHost"
            placeholder={t("e.g. my-laptop or 100.101.102.103")}
            value={form.values.sftpHost}
            onChange={e => form.setValue("sftpHost", e.target.value)}
            onBlur={() => form.saveText("sftpHost", t("Computer address"))}
          />
        </div>
        <div className="w-24 space-y-1.5">
          <Label htmlFor="backup-sftpPort">{t("Port")}</Label>
          <Input
            id="backup-sftpPort"
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={e => setPort(e.target.value)}
            onBlur={() => {
              const n = Number(port);
              if (!Number.isInteger(n) || n < 1 || n > 65535 || n === data.sftpPort) {
                setPort(String(data.sftpPort));
                return;
              }
              form.save({
                sftpPort: n,
              }, t("Port"));
            }}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {t("The computer's Tailscale name (MagicDNS) or its 100.x.y.z address, from the Tailscale app on that computer.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="backup-sftpUsername">{t("Username")}</Label>
        <Input
          id="backup-sftpUsername"
          autoComplete="off"
          value={form.values.sftpUsername}
          onChange={e => form.setValue("sftpUsername", e.target.value)}
          onBlur={() => form.saveText("sftpUsername", t("Username"))}
        />
        <p className="text-xs text-muted-foreground">
          {t("Your login name on that computer (on a Mac, the short name shown in Terminal by whoami).")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="backup-sftpPath">{t("Folder")}</Label>
        <Input
          id="backup-sftpPath"
          placeholder="eesimple-backups"
          value={form.values.sftpPath}
          onChange={e => form.setValue("sftpPath", e.target.value)}
          onBlur={() => form.saveText("sftpPath", t("Folder"))}
        />
        <p className="text-xs text-muted-foreground">
          {t("Inside the user's home folder unless it starts with /. It's created if it doesn't exist. Backups go in its db folder, images in its images folder.")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="backup-sftpAuth">{t("Sign in with")}</Label>
        <Select
          value={data.sftpAuthMethod}
          onValueChange={value => form.save({
            sftpAuthMethod: value as BackupSftpAuthMethod,
          }, t("Sign in with"))}
        >
          <SelectTrigger
            id="backup-sftpAuth"
            className="w-56"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="password">{t("Password")}</SelectItem>
            <SelectItem value="key">{t("A key made by this app")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.sftpAuthMethod === "password"
        ? (
          <div className="space-y-1.5">
            <Label htmlFor="backup-sftpPassword">{t("Password")}</Label>
            <Input
              id="backup-sftpPassword"
              type="password"
              autoComplete="off"
              placeholder={data.sftpPasswordSet ? "••••••••" : t("No password stored")}
              value={form.secrets.sftpPassword ?? ""}
              onChange={e => form.setSecret("sftpPassword", e.target.value)}
              onBlur={() => form.saveSecret("sftpPassword", t("Password"))}
            />
            <p className="text-xs text-muted-foreground">
              {data.sftpPasswordSet
                ? t("A password is stored and is never shown. Type a new one to replace it.")
                : t("The password you use to log in to that computer.")}
              {!data.encryptionEnabled && ` ${t("Set the APP_SECRET env var to encrypt it at rest.")}`}
            </p>
          </div>
        )
        : <PublicKeyPanel data={data} />}
      <HostIdentity data={data} />
    </div>
  );
}
