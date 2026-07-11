import type { Bookmark, CustomProperty, SectionEntry } from "@eesimple/types";
import type { ReactNode } from "react";

import { IsbnLinksPanel } from "./IsbnLinksPanel";
import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";
import { StarRating } from "./StarRating";
import i18n from "../i18n";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkPropertyRows } from "../lib/bookmarkPropertyRows";
import { formatSectionEntry } from "../lib/propertyFormat";

import { LabeledSection } from "@/components/LabeledSection";

interface BookmarkPropertySectionsProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The custom-property value rows of a bookmark, rendered as one flat "Properties" section. Renders
 * nothing when the bookmark has no resolvable property values.
 */
export function BookmarkPropertySections({
  bookmark, properties, onSaveBoolean,
}: BookmarkPropertySectionsProps) {
  // The per-card boolean display knobs (show-if-false / colon / value-order / clickable) come from the
  // Default card display rule on non-listing surfaces like this one.
  const defaultZones = useDefaultFieldZones();

  const {
    numberRows, ratingRows, booleanRows, dateTimeRows, fileRows, choicesRows, progressRows, sectionsRows, textRows,
  } = buildBookmarkPropertyRows(bookmark, properties, defaultZones);

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0
    || dateTimeRows.length > 0 || ratingRows.length > 0 || fileRows.length > 0
    || choicesRows.length > 0 || progressRows.length > 0 || sectionsRows.length > 0
    || textRows.length > 0;
  if (!hasProperties) return null;

  return (
    <>
      <div>
        <LabeledSection title={i18n.t("Properties")}>
          <dl className="space-y-1">
            {numberRows.map(row => (
              <div
                key={row.id}
                className="group flex items-baseline gap-2"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  {row.isCalculated
                    ? <span className="text-xs"> {i18n.t("(calculated)")}</span>
                    : null}
                  :
                </dt>
                <dd>{row.value}</dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {booleanRows.map((row) => {
              const isClickable = onSaveBoolean !== undefined && row.clickableInView;
              // When clickable, both the label and the value toggle the boolean.
              const toggle = isClickable
                ? () => onSaveBoolean(row.id, !row.rawValue)
                : undefined;
              const wrap = (content: ReactNode): ReactNode =>
                toggle
                  ? (
                    <button
                      className="
                        cursor-pointer
                        hover:underline
                      "
                      title={i18n.t("Click to toggle")}
                      type="button"
                      onClick={toggle}
                    >
                      {content}
                    </button>
                  )
                  : content;
              return (
                <div
                  key={row.id}
                  className="group flex items-baseline gap-2"
                >
                  {row.showValueBeforeLabel
                    ? (
                      <>
                        <dd>{wrap(row.value)}</dd>
                        <dt className="text-muted-foreground">
                          {wrap(row.showLabelColon ? `: ${row.name}` : row.name)}
                        </dt>
                      </>
                    )
                    : (
                      <>
                        <dt className="text-muted-foreground">
                          {wrap(
                            <>
                              {row.name}
                              {row.showLabelColon ? ":" : ""}
                            </>,
                          )}
                        </dt>
                        <dd>{wrap(row.value)}</dd>
                      </>
                    )}
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
                </div>
              );
            })}
            {dateTimeRows.map(row => (
              <div
                key={row.id}
                className="group flex items-baseline gap-2"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  :
                </dt>
                <dd>{row.value}</dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {ratingRows.map(row => (
              <div
                key={row.id}
                className="group flex items-center gap-2"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  :
                </dt>
                <dd>
                  <StarRating
                    value={row.value}
                    max={row.max}
                    allowHalf={row.allowHalf}
                    readOnly
                    label={row.label}
                    size={16}
                  />
                </dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {fileRows.map(row => (
              <div
                key={row.id}
                className="group flex items-baseline gap-2"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  :
                </dt>
                <dd>
                  {row.isImage
                    ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={row.url}
                          alt={row.name}
                          className="max-h-40 rounded-md border"
                        />
                      </a>
                    )
                    : (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        {row.filename ?? i18n.t("Download")}
                      </a>
                    )}
                </dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {choicesRows.map((row) => {
              const selectedLabels = row.selectedValues
                .map(val => row.items.find(item => item.value === val)?.label ?? val);
              return (
                <div
                  key={row.id}
                  className="group flex items-baseline gap-2"
                >
                  <dt className="text-muted-foreground">
                    {row.name}
                    :
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {selectedLabels.map(label => (
                      <span
                        key={label}
                        className="
                          rounded-sm bg-secondary px-1.5 py-0.5 text-xs
                          text-secondary-foreground
                        "
                      >
                        {label}
                      </span>
                    ))}
                  </dd>
                  <PropertyQuickFilterLink
                    search={row.search}
                    name={row.name}
                  />
                </div>
              );
            })}
            {progressRows.map(row => (
              <div
                key={row.id}
                className="group flex items-baseline gap-2"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  :
                </dt>
                <dd>{row.formatted}</dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {sectionsRows.map(row => (
              <div
                key={row.id}
                className="group flex flex-col gap-1"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  {row.exhaustive
                    ? <span className="ml-1 text-xs">{i18n.t("(exhaustive)")}</span>
                    : null}
                  :
                </dt>
                <dd>
                  {row.sections.length === 0
                    ? <span className="text-xs text-muted-foreground">{i18n.t("No sections")}</span>
                    : (
                      <ul className="space-y-0.5 text-sm">
                        {row.sections.map((entry: SectionEntry) => (
                          <li key={entry.id}>
                            {formatSectionEntry(entry)}
                            {entry.children && entry.children.length > 0
                              ? (
                                <ul
                                  className="
                                    ml-4 space-y-0.5 border-l pl-2
                                    text-muted-foreground
                                  "
                                >
                                  {entry.children.map((child: SectionEntry) => (
                                    <li key={child.id}>{formatSectionEntry(child)}</li>
                                  ))}
                                </ul>
                              )
                              : null}
                          </li>
                        ))}
                      </ul>
                    )}
                </dd>
                <PropertyQuickFilterLink
                  search={row.search}
                  name={row.name}
                />
              </div>
            ))}
            {textRows.map(row => (
              <div
                key={row.id}
                className="flex flex-col gap-1"
              >
                <dt className="text-muted-foreground">
                  {row.name}
                  :
                </dt>
                <dd>
                  <span className="font-mono text-sm">{row.value}</span>
                  {row.links.length > 0 && (
                    <IsbnLinksPanel links={row.links} />
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </LabeledSection>
      </div>
    </>
  );
}
