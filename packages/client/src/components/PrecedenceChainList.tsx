import type { ScanPipelinePrecedence } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { GateBadge } from "./GateBadge";

/**
 * An ordered fallback/merge chain from the scan-pipeline description: a numbered source list with
 * per-source gate badges, footed by a note explaining how the chain combines its sources. The
 * titles/labels/descriptions are server-authored data and render as-is.
 */
export function PrecedenceChainList({
  precedence,
}: { precedence: ScanPipelinePrecedence }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{precedence.title}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {precedence.sources.map(source => (
          <li
            key={source.id}
            className="text-sm"
          >
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{source.label}</span>
              {source.gate && (
                <GateBadge
                  gate={source.gate}
                  live={source.live}
                />
              )}
            </span>
            {source.description && (
              <p className="text-xs text-muted-foreground">{source.description}</p>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground italic">
        {precedence.mode === "first-non-null"
          ? t("The first source that yields a value wins.")
          : t("Later sources fill or refine fields from earlier ones.")}
      </p>
    </div>
  );
}
