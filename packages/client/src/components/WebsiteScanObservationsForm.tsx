import type { UpdateWebsiteInput, Website, WebsiteScanObservation, WebsiteScanObservationKind } from "@eesimple/types";

import { useState } from "react";

import { WEBSITE_SCAN_OBSERVATION_KINDS, WEBSITE_SCAN_OBSERVATION_LABELS } from "@eesimple/types";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import i18n from "../i18n";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  scanObservations: i18n.t("Scanner observations"),
};

/**
 * Edit a website's scanner-observation log. The scanner records these automatically; here an operator
 * can remove a stale one or add a manual note. Auto-saves the whole list on each add/remove (one PATCH
 * + toast). Removing a scanner-detected observation may let it reappear on the next scan (accepted).
 */
export function WebsiteScanObservationsForm({
  website,
}: {
  website: Website;
}) {
  const {
    t,
  } = useTranslation();
  const updateWebsite = useUpdateWebsite();
  const [observations, setObservations] = useState<WebsiteScanObservation[]>(() => website.scanObservations);
  const [kind, setKind] = useState<WebsiteScanObservationKind | "">("");
  const [detail, setDetail] = useState("");

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      scanObservations: website.scanObservations,
    },
  });

  function persist(next: WebsiteScanObservation[]): void {
    setObservations(next);
    autoSave.saveField("scanObservations", next);
  }

  function addObservation(): void {
    if (!kind) return;
    // Dedupe by kind — a manual add of an existing kind replaces it.
    const rest = observations.filter(observation => observation.kind !== kind);
    const trimmed = detail.trim();
    persist([...rest, {
      kind,
      source: "manual",
      ...(trimmed
        ? {
          detail: trimmed,
        }
        : {}),
    }]);
    setKind("");
    setDetail("");
  }

  const options = WEBSITE_SCAN_OBSERVATION_KINDS.map(observationKind => ({
    value: observationKind,
    label: t(WEBSITE_SCAN_OBSERVATION_LABELS[observationKind]),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("What the scanner has learned about this site. Recorded automatically — you can remove one or add a note.")}
      </p>
      {observations.length > 0
        ? (
          <ul className="space-y-2">
            {observations.map(observation => (
              <li
                key={observation.kind}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary">{t(WEBSITE_SCAN_OBSERVATION_LABELS[observation.kind])}</Badge>
                {observation.detail
                  ? <span className="text-sm text-muted-foreground">{observation.detail}</span>
                  : null}
                {observation.source === "manual"
                  ? <span className="text-xs text-muted-foreground">{t("(manual)")}</span>
                  : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  aria-label={t("Remove observation")}
                  onClick={() => persist(observations.filter(other => other.kind !== observation.kind))}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )
        : <p className="text-sm text-muted-foreground">{t("No observations yet.")}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <Combobox
          aria-label={t("Observation")}
          options={options}
          value={kind || undefined}
          placeholder={t("Add an observation")}
          emptyText={t("No kinds found.")}
          onValueChange={value => setKind((value as WebsiteScanObservationKind | undefined) ?? "")}
        />
        <Input
          className="max-w-48"
          placeholder={t("Detail (optional)")}
          value={detail}
          onChange={event => setDetail(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!kind}
          onClick={addObservation}
        >
          {t("Add")}
        </Button>
      </div>
    </div>
  );
}
