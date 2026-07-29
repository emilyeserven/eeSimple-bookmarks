import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { Plus } from "lucide-react";

import { paramListColumns } from "./tables/paramListColumns";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import i18n from "../i18n";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  stripParams: i18n.t("Strip URL params"),
};

interface Props {
  website: Website;
}

/**
 * Edit a website's blacklist of query params to always strip from its URLs on save (e.g. YouTube's
 * `t`). Auto-saves on change; applied by the shared canonicalizer regardless of cleanup mode.
 */
export function WebsiteStripParamsForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const [params, setParams] = useState<string[]>(() => website.stripParams ?? []);
  const [newParam, setNewParam] = useState("");

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      stripParams: website.stripParams ?? [],
    },
  });

  function commit(next: string[]): void {
    setParams(next);
    autoSave.saveField("stripParams", next);
  }

  function add(): void {
    const param = newParam.trim();
    if (!param || params.includes(param)) {
      setNewParam("");
      return;
    }
    commit([...params, param]);
    setNewParam("");
  }

  function remove(param: string): void {
    commit(params.filter(p => p !== param));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {i18n.t(
          "Query parameters removed from this site's URLs when a bookmark is saved (e.g. YouTube's t). Applied on every save path, on top of any tracker stripping and param rules.",
        )}
      </p>
      <div className="flex max-w-sm gap-2">
        <Input
          placeholder={i18n.t("e.g. t")}
          value={newParam}
          onChange={event => setNewParam(event.target.value)}
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
        >
          <Plus className="mr-1 size-4" />
          {i18n.t("Add")}
        </Button>
      </div>
      <DataTable<string>
        columns={paramListColumns(remove)}
        data={params}
        emptyMessage={i18n.t("No params configured.")}
      />
    </div>
  );
}
