import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";

import { useState } from "react";

import { RefreshCw } from "lucide-react";

import { SyncFromSourceModal } from "@/components/SyncFromSourceModal";
import { Button } from "@/components/ui/button";

/**
 * Desktop header button that opens the {@link SyncFromSourceModal}, owning its own open state (the
 * same self-contained shape as the layout popover the header renders inline).
 */
export function SyncActionButton({
  provider,
}: {
  provider: SyncProvider;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sync from source"
        title="Sync from source"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="size-4" />
      </Button>
      <SyncFromSourceModal
        provider={provider}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
