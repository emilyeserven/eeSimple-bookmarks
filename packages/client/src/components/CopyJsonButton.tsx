import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { copyText } from "../lib/clipboard";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

export function CopyJsonButton({
  data, label = "Copy JSON",
}: { data: unknown;
  label?: string; }) {
  const {
    t,
  } = useTranslation();
  async function handleCopy() {
    try {
      await copyText(JSON.stringify(data, null, 2));
      notifySuccess(t("Copied to clipboard"));
    }
    catch {
      notifyError(t("Couldn't copy to clipboard"));
    }
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
    >
      <Copy className="size-4" />
      {label}
    </Button>
  );
}
