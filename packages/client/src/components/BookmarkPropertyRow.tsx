import type { IsbnLink } from "../lib/isbnLinks";
import type { Bookmark, CustomProperty, SectionEntry } from "@eesimple/types";
import type { ReactNode } from "react";

import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";
import { StarRating } from "./StarRating";
import i18n from "../i18n";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkPropertyRows } from "../lib/bookmarkPropertyRows";
import { formatSectionEntry } from "../lib/propertyFormat";

function IsbnLinksPanel({
  links,
}: { links: IsbnLink[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {links.map(link => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-primary underline-offset-2
            hover:underline
          "
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

interface BookmarkPropertyRowProps {
  bookmark: Bookmark;
  /** The single custom property whose value row is rendered. */
  property: CustomProperty;
  /** When provided, a `clickableInView` boolean row renders as a toggle. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * Renders **one** custom property's read-only value row — the single-property extraction of the row
 * markup that used to live inline in `BookmarkPropertySections`, so each property is an independently
 * placeable **view** field (#1163+). Builds the typed row for just this property via the shared pure
 * `buildBookmarkPropertyRows` and renders whichever value-kind matched; returns `null` when the property
 * has no resolvable value (not `showInDetails`, empty, or the wrong type) — the layout `space-y-*` stack
 * then adds no gap for it, exactly like the other self-hiding view fields.
 */
export function BookmarkPropertyRow({
  bookmark, property, onSaveBoolean,
}: BookmarkPropertyRowProps) {
  // The per-card boolean display knobs (show-if-false / colon / value-order / clickable) come from the
  // Default card display rule on non-listing surfaces like this one.
  const defaultZones = useDefaultFieldZones();
  const {
    numberRows, ratingRows, booleanRows, dateTimeRows, fileRows, choicesRows, progressRows, sectionsRows, textRows,
  } = buildBookmarkPropertyRows(bookmark, [property], defaultZones);

  const numberRow = numberRows[0];
  if (numberRow) {
    return (
      <div className="group flex items-baseline gap-2">
        <dt className="text-muted-foreground">
          {numberRow.name}
          {numberRow.isCalculated
            ? <span className="text-xs"> {i18n.t("(calculated)")}</span>
            : null}
          :
        </dt>
        <dd>{numberRow.value}</dd>
        <PropertyQuickFilterLink
          search={numberRow.search}
          name={numberRow.name}
        />
      </div>
    );
  }

  const booleanRow = booleanRows[0];
  if (booleanRow) {
    const isClickable = onSaveBoolean !== undefined && booleanRow.clickableInView;
    const toggle = isClickable
      ? () => onSaveBoolean(booleanRow.id, !booleanRow.rawValue)
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
      <div className="group flex items-baseline gap-2">
        {booleanRow.showValueBeforeLabel
          ? (
            <>
              <dd>{wrap(booleanRow.value)}</dd>
              <dt className="text-muted-foreground">
                {wrap(booleanRow.showLabelColon ? `: ${booleanRow.name}` : booleanRow.name)}
              </dt>
            </>
          )
          : (
            <>
              <dt className="text-muted-foreground">
                {wrap(
                  <>
                    {booleanRow.name}
                    {booleanRow.showLabelColon ? ":" : ""}
                  </>,
                )}
              </dt>
              <dd>{wrap(booleanRow.value)}</dd>
            </>
          )}
        <PropertyQuickFilterLink
          search={booleanRow.search}
          name={booleanRow.name}
        />
      </div>
    );
  }

  const dateTimeRow = dateTimeRows[0];
  if (dateTimeRow) {
    return (
      <div className="group flex items-baseline gap-2">
        <dt className="text-muted-foreground">
          {dateTimeRow.name}
          :
        </dt>
        <dd>{dateTimeRow.value}</dd>
        <PropertyQuickFilterLink
          search={dateTimeRow.search}
          name={dateTimeRow.name}
        />
      </div>
    );
  }

  const ratingRow = ratingRows[0];
  if (ratingRow) {
    return (
      <div className="group flex items-center gap-2">
        <dt className="text-muted-foreground">
          {ratingRow.name}
          :
        </dt>
        <dd>
          <StarRating
            value={ratingRow.value}
            max={ratingRow.max}
            allowHalf={ratingRow.allowHalf}
            readOnly
            label={ratingRow.label}
            size={16}
          />
        </dd>
        <PropertyQuickFilterLink
          search={ratingRow.search}
          name={ratingRow.name}
        />
      </div>
    );
  }

  const fileRow = fileRows[0];
  if (fileRow) {
    return (
      <div className="group flex items-baseline gap-2">
        <dt className="text-muted-foreground">
          {fileRow.name}
          :
        </dt>
        <dd>
          {fileRow.isImage
            ? (
              <a
                href={fileRow.url}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={fileRow.url}
                  alt={fileRow.name}
                  className="max-h-40 rounded-md border"
                />
              </a>
            )
            : (
              <a
                href={fileRow.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {fileRow.filename ?? i18n.t("Download")}
              </a>
            )}
        </dd>
        <PropertyQuickFilterLink
          search={fileRow.search}
          name={fileRow.name}
        />
      </div>
    );
  }

  const choicesRow = choicesRows[0];
  if (choicesRow) {
    const selectedLabels = choicesRow.selectedValues
      .map(val => choicesRow.items.find(item => item.value === val)?.label ?? val);
    return (
      <div className="group flex items-baseline gap-2">
        <dt className="text-muted-foreground">
          {choicesRow.name}
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
          search={choicesRow.search}
          name={choicesRow.name}
        />
      </div>
    );
  }

  const progressRow = progressRows[0];
  if (progressRow) {
    return (
      <div className="group flex items-baseline gap-2">
        <dt className="text-muted-foreground">
          {progressRow.name}
          :
        </dt>
        <dd>{progressRow.formatted}</dd>
        <PropertyQuickFilterLink
          search={progressRow.search}
          name={progressRow.name}
        />
      </div>
    );
  }

  const sectionsRow = sectionsRows[0];
  if (sectionsRow) {
    return (
      <div className="group flex flex-col gap-1">
        <dt className="text-muted-foreground">
          {sectionsRow.name}
          {sectionsRow.exhaustive
            ? <span className="ml-1 text-xs">{i18n.t("(exhaustive)")}</span>
            : null}
          :
        </dt>
        <dd>
          {sectionsRow.sections.length === 0
            ? <span className="text-xs text-muted-foreground">{i18n.t("No sections")}</span>
            : (
              <ul className="space-y-0.5 text-sm">
                {sectionsRow.sections.map((entry: SectionEntry) => (
                  <li key={entry.id}>{formatSectionEntry(entry)}</li>
                ))}
              </ul>
            )}
        </dd>
        <PropertyQuickFilterLink
          search={sectionsRow.search}
          name={sectionsRow.name}
        />
      </div>
    );
  }

  const textRow = textRows[0];
  if (textRow) {
    return (
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">
          {textRow.name}
          :
        </dt>
        <dd>
          <span className="font-mono text-sm">{textRow.value}</span>
          {textRow.links.length > 0 && (
            <IsbnLinksPanel links={textRow.links} />
          )}
        </dd>
      </div>
    );
  }

  return null;
}
