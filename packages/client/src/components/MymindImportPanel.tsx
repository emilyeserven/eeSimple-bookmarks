import type { MymindImportFormOptions } from "../lib/mymindImportRunner";
import type { MymindCsvRow } from "@eesimple/types";

import { useMemo, useState } from "react";

import { buildMymindImportCards, mymindTagStats, parseMymindCsv } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { MymindImportOptionsFields } from "./MymindImportOptions";
import { MymindImportResults } from "./MymindImportResults";
import { useMymindImport } from "../hooks/useMymindImport";
import { DEFAULT_MYMIND_IMPORT_OPTIONS } from "../lib/mymindImportRunner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** What will be imported, given the parsed rows and the current options. */
function MymindImportPreview({
  rows, options,
}: {
  rows: MymindCsvRow[];
  options: MymindImportFormOptions;
}) {
  const {
    t,
  } = useTranslation();
  const plan = useMemo(() => buildMymindImportCards(rows, options), [rows, options]);
  const stats = useMemo(() => mymindTagStats(plan.cards), [plan]);
  return (
    <div className="space-y-1 text-sm">
      <p>
        {t("{{rows}} cards → {{bookmarks}} bookmarks with {{tags}} distinct tags.", {
          rows: rows.length,
          bookmarks: plan.cards.length,
          tags: stats.tagCount,
        })}
      </p>
      {plan.mergedCount > 0 && (
        <p className="text-muted-foreground">
          {t("{{count}} cards share a URL with another card and will be merged into it (tags combined, titles listed in the description).", {
            count: plan.mergedCount,
          })}
        </p>
      )}
      {plan.skippedUrlless > 0 && (
        <p className="text-muted-foreground">
          {t("{{count}} cards without a URL will be skipped.", {
            count: plan.skippedUrlless,
          })}
        </p>
      )}
      {options.nestPrefixedTags && stats.prefixGroups.length > 0 && (
        <p className="text-muted-foreground">
          {t("Nested tag groups: {{groups}}", {
            groups: stats.prefixGroups.map(group => `${group.prefix} (${group.valueCount})`).join(", "),
          })}
        </p>
      )}
    </div>
  );
}

/**
 * Settings → Advanced → Import Bookmarks: upload a mymind `cards.csv` export, preview what it becomes,
 * and import it straight into bookmarks (batched, with progress). Card images aren't imported.
 */
export function MymindImportPanel() {
  const {
    t,
  } = useTranslation();
  const [rows, setRows] = useState<MymindCsvRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [options, setOptions] = useState<MymindImportFormOptions>(DEFAULT_MYMIND_IMPORT_OPTIONS);
  const importer = useMymindImport();
  const running = importer.isPending;

  async function handleFile(file: File | undefined) {
    importer.reset();
    setRows(null);
    setParseError(null);
    if (!file) return;
    const parsed = parseMymindCsv(await file.text());
    if (!parsed) setParseError(t("This doesn't look like a mymind cards.csv export."));
    else setRows(parsed);
  }

  function handleImport() {
    if (!rows) return;
    const {
      includeUrlless, ...serverOptions
    } = options;
    importer.mutate({
      cards: buildMymindImportCards(rows, {
        includeUrlless,
      }).cards,
      options: serverOptions,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Import from mymind")}</CardTitle>
        <CardDescription>
          {t("Upload the cards.csv file from your mymind export. Links, titles, notes, and tags are imported; the exported images are not.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="mymind-csv">{t("cards.csv")}</Label>
          <Input
            id="mymind-csv"
            type="file"
            accept=".csv,text/csv"
            disabled={running}
            onChange={event => void handleFile(event.target.files?.[0])}
          />
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
        </div>
        {rows && (
          <>
            <MymindImportPreview
              rows={rows}
              options={options}
            />
            <MymindImportOptionsFields
              value={options}
              onChange={setOptions}
              disabled={running}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleImport}
                disabled={running || rows.length === 0}
              >
                {running ? t("Importing…") : t("Import")}
              </Button>
              {running && importer.progress && (
                <span className="text-sm text-muted-foreground">
                  {t("{{done}} / {{total}} bookmarks", importer.progress)}
                </span>
              )}
            </div>
          </>
        )}
        {importer.data && <MymindImportResults summary={importer.data} />}
      </CardContent>
    </Card>
  );
}
