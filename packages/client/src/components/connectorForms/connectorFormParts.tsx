import type { CheckUrlResult } from "@eesimple/types";
import type { ReactNode } from "react";

import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Inline status for a connection check attempt. */
export function CheckConnectionResult({
  result,
}: { result: CheckUrlResult | null }) {
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
        {t("Reachable")}
        {result.status ? ` (HTTP ${result.status})` : ""}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-destructive">
      <XCircle className="size-4" />
      {result.reason === "timeout"
        ? t("Timed out")
        : result.reason === "network_error"
          ? t("Connection refused")
          : `HTTP ${result.status ?? "error"}`}
    </span>
  );
}

/** Description text beneath the API key field, varying by stored state and encryption config. */
export function ApiKeyHint({
  apiKeySet, encryptionEnabled, unsetHint,
}: { apiKeySet: boolean;
  encryptionEnabled: boolean;
  /** Copy shown while no key is stored, telling the user where the key comes from. */
  unsetHint?: ReactNode; }) {
  const {
    t,
  } = useTranslation();
  return (
    <p className="text-xs text-muted-foreground">
      {apiKeySet
        ? t("A token is stored — the value is never shown. Type a new token to replace it. To clear the stored token, type a single space and save.")
        : unsetHint ?? t("Optional. Set the TOKEN env var on your Browserless container and enter the same value here. Sent as an Authorization: Bearer header.")}
      {!encryptionEnabled && (
        <>
          {" "}
          {t("Set the")}
          {" "}
          <code>APP_SECRET</code>
          {" "}
          {t("env var to encrypt this token at rest.")}
        </>
      )}
    </p>
  );
}
