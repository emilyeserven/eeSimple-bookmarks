import type { ImportBlacklistEntry, ImportBlacklistKind } from "@eesimple/types";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { importBlacklistColumns } from "./tables/importBlacklistColumns";
import { useImportsBlacklist } from "./useImportsBlacklist";

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

// Re-exported so existing consumers importing `ProcessedItemsCard` from this module keep working.
export { ProcessedItemsCard } from "./ProcessedItemsCard";

/** Editor for the imports blacklist: links matching these are dropped from future imports. */
export function ImportsBlacklistCard() {
  const {
    t,
  } = useTranslation();
  const {
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
  } = useImportsBlacklist();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Imports Blacklist")}</CardTitle>
        <CardDescription>
          {t("Links matching these are skipped on future imports. Block a single URL, a whole domain, or a page-path prefix (e.g.")}
          {" "}
          <code>example.com/sponsored</code>
          {" "}
          {t("blocks everything under that path). You can also add an entry straight from the Block action in your inbox.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
          : (
            <>
              <div className="flex max-w-xl flex-wrap gap-2">
                <Select
                  value={kind}
                  onValueChange={v => setKind(v as ImportBlacklistKind)}
                >
                  <SelectTrigger
                    aria-label={t("Block type")}
                    className="w-32"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">{t("Domain")}</SelectItem>
                    <SelectItem value="path-prefix">{t("Page path")}</SelectItem>
                    <SelectItem value="exact">{t("Exact URL")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="min-w-48 flex-1"
                  placeholder={kind === "domain" ? t("e.g. example.com") : t("e.g. example.com/sponsored")}
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
                  {t("Add")}
                </Button>
              </div>
              {entries.length > 0
                ? (
                  <Input
                    className="max-w-xs"
                    placeholder={t("Filter blocked links…")}
                    value={filter}
                    onChange={event => setFilter(event.target.value)}
                  />
                )
                : null}
              <DataTable<ImportBlacklistEntry>
                columns={importBlacklistColumns(remove)}
                data={visible}
                emptyMessage={q ? t("No matches.") : t("No blocked links yet.")}
              />
            </>
          )}
      </CardContent>
    </Card>
  );
}
