import type { ImportBlacklistEntry, ImportBlacklistKind } from "@eesimple/types";

import { useState } from "react";

import { KIND_LABEL } from "./tables/importBlacklistColumns";
import { useImportBlacklist, useUpdateImportBlacklist } from "../hooks/useAppSettings";
import { entryFromInput } from "../lib/importBlacklist";

/**
 * State + mutation orchestration for {@link ImportsBlacklistCard}: the blacklist query, the add/
 * filter inputs, the in-memory filtered view, and the add/remove update mutations (each firing the
 * field-named toast). Extracted to keep the card thin.
 */
export function useImportsBlacklist() {
  const {
    data: entries = [], isLoading,
  } = useImportBlacklist();
  const update = useUpdateImportBlacklist();
  const [kind, setKind] = useState<ImportBlacklistKind>("domain");
  const [value, setValue] = useState("");
  const [filter, setFilter] = useState("");

  const q = filter.trim().toLowerCase();
  const visible = q
    ? entries.filter(e => e.value.toLowerCase().includes(q) || KIND_LABEL[e.kind].includes(q))
    : entries;

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
    update.mutate({
      input: [...entries, entry],
      successMessage: `Blocked ${KIND_LABEL[entry.kind]} ${entry.value}`,
      errorMessage: "Couldn't update the imports blacklist",
    });
    setValue("");
  }

  function remove(entry: ImportBlacklistEntry): void {
    update.mutate({
      input: entries.filter(e => !(e.kind === entry.kind && e.value === entry.value)),
      successMessage: `Unblocked ${entry.value}`,
      errorMessage: "Couldn't update the imports blacklist",
    });
  }

  return {
    entries,
    isLoading,
    update,
    kind,
    setKind,
    value,
    setValue,
    filter,
    setFilter,
    q,
    visible,
    add,
    remove,
  };
}
