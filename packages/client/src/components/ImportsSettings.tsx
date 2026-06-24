import type { ImportBlacklistEntry, ImportBlacklistKind } from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Plus, Trash2 } from "lucide-react";

import { KIND_LABEL, importBlacklistColumns } from "./tables/importBlacklistColumns";
import { useImportBlacklist, useUpdateImportBlacklist } from "../hooks/useAppSettings";
import { usePurgeProcessedItems } from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Derive a normalized blacklist entry from free text (a URL or bare host) for the chosen kind. */
function entryFromInput(kind: ImportBlacklistKind, raw: string): ImportBlacklistEntry {
  const trimmed = raw.trim();
  try {
    const url = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const patterns = blacklistPatternsFor(url);
    if (kind === "domain") return patterns.domain;
    if (kind === "exact") return patterns.exact;
    return patterns.pathPrefix;
  }
  catch {
    return {
      kind,
      value: trimmed.toLowerCase(),
    };
  }
}

/** Editor for the imports blacklist: links matching these are dropped from future imports. */
function ImportsBlacklistCard() {
  const {
    data: entries = [], isLoading,
  } = useImportBlacklist();
  const update = useUpdateImportBlacklist();
  const [kind, setKind] = useState<ImportBlacklistKind>("domain");
  const [value, setValue] = useState("");

  function add(): void {
    const entry = entryFromInput(kind, value);
    if (entry.value.length === 0) {
      setValue("");
      return;
    }
    if (entries.some(e => e.kind === entry.kind && e.value === entry.value)) {
      setValue("");
      return;
    }
    update.mutate([...entries, entry], {
      onSuccess: () => notifySuccess(`Blocked ${KIND_LABEL[entry.kind]} ${entry.value}`),
      onError: () => notifyError("Couldn't update the imports blacklist"),
    });
    setValue("");
  }

  function remove(entry: ImportBlacklistEntry): void {
    update.mutate(entries.filter(e => !(e.kind === entry.kind && e.value === entry.value)), {
      onSuccess: () => notifySuccess(`Unblocked ${entry.value}`),
      onError: () => notifyError("Couldn't update the imports blacklist"),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imports Blacklist</CardTitle>
        <CardDescription>
          Links matching these are skipped on future imports. Block a single URL, a whole domain, or a
          page-path prefix (e.g.
          {" "}
          <code>example.com/sponsored</code>
          {" "}
          blocks everything under that path). You can
          also add an entry straight from the Block action in your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : (
            <>
              <div className="flex max-w-xl flex-wrap gap-2">
                <Select
                  value={kind}
                  onValueChange={v => setKind(v as ImportBlacklistKind)}
                >
                  <SelectTrigger
                    aria-label="Block type"
                    className="w-32"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="path-prefix">Page path</SelectItem>
                    <SelectItem value="exact">Exact URL</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="min-w-48 flex-1"
                  placeholder={kind === "domain" ? "e.g. example.com" : "e.g. example.com/sponsored"}
                  value={value}
                  onChange={event => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      add();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={add}
                  disabled={update.isPending}
                >
                  <Plus className="mr-1 size-4" />
                  Add
                </Button>
              </div>
              <DataTable<ImportBlacklistEntry>
                columns={importBlacklistColumns(remove)}
                data={entries}
                emptyMessage="No blocked links yet."
              />
            </>
          )}
      </CardContent>
    </Card>
  );
}

/** Sweep processed inbox items: those marked for deletion (a bookmark was created) + blocked items. */
function ProcessedItemsCard() {
  const purge = usePurgeProcessedItems();

  function onPurge(): void {
    purge.mutate(undefined, {
      onSuccess: (result) => {
        notifySuccess(
          result.deleted === 0
            ? "No processed items to delete"
            : `Deleted ${result.deleted} processed item${result.deleted === 1 ? "" : "s"}`,
        );
      },
      onError: () => notifyError("Couldn't delete processed items"),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed items</CardTitle>
        <CardDescription>
          Delete every inbox item that has been processed: items marked for deletion (a bookmark was
          already created from them) and blocked items. Blocked links stay on the Imports Blacklist, so
          they’re still skipped on future imports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          onClick={onPurge}
          disabled={purge.isPending}
        >
          <Trash2 className="mr-1 size-4" />
          Delete all items marked for deletion
        </Button>
      </CardContent>
    </Card>
  );
}

/** Import Settings: the imports blacklist and the processed-items purge. */
export function ImportsSettings() {
  return (
    <>
      <ImportsBlacklistCard />
      <ProcessedItemsCard />
    </>
  );
}
