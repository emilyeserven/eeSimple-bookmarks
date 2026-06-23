import { Copy } from "lucide-react";

import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

export function CopyJsonButton({
  data, label = "Copy JSON",
}: { data: unknown;
  label?: string; }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      notifySuccess("Copied to clipboard");
    }
    catch {
      notifyError("Couldn't copy to clipboard");
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
