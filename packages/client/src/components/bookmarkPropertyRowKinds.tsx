import type {
  BooleanPropertyRow,
  ChoicesPropertyRow,
  DateTimePropertyRow,
  FilePropertyRow,
  NumberPropertyRow,
  ProgressPropertyRow,
  RatingPropertyRow,
  SectionsPropertyRow,
  TextPropertyRow,
} from "../lib/bookmarkPropertyRows";
import type { SectionEntry } from "@eesimple/types";
import type { ReactNode } from "react";

import { IsbnLinksPanel } from "./IsbnLinksPanel";
import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";
import { StarRating } from "./StarRating";
import i18n from "../i18n";
import { formatSectionEntry } from "../lib/propertyFormat";

/**
 * Per-value-kind read-only row cells, extracted from `BookmarkPropertyRow` so the parent stays a
 * flat dispatcher and each kind's markup is scored (and story-covered) on its own. Each returns the
 * `<div>…<dt>…<dd>…</dd><PropertyQuickFilterLink/></div>` row for one built property row.
 */

export function NumberRowCell({
  row,
}: { row: NumberPropertyRow }) {
  return (
    <div className="group flex items-baseline gap-2">
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
  );
}

export function BooleanRowCell({
  row, onSaveBoolean,
}: { row: BooleanPropertyRow;
  onSaveBoolean?: (propertyId: string, value: boolean) => void; }) {
  const isClickable = onSaveBoolean !== undefined && row.clickableInView;
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
    <div className="group flex items-baseline gap-2">
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
}

export function DateTimeRowCell({
  row,
}: { row: DateTimePropertyRow }) {
  return (
    <div className="group flex items-baseline gap-2">
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
  );
}

export function RatingRowCell({
  row,
}: { row: RatingPropertyRow }) {
  return (
    <div className="group flex items-center gap-2">
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
  );
}

export function FileRowCell({
  row,
}: { row: FilePropertyRow }) {
  return (
    <div className="group flex items-baseline gap-2">
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
  );
}

export function ChoicesRowCell({
  row,
}: { row: ChoicesPropertyRow }) {
  const selectedLabels = row.selectedValues
    .map(val => row.items.find(item => item.value === val)?.label ?? val);
  return (
    <div className="group flex items-baseline gap-2">
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
}

export function ProgressRowCell({
  row,
}: { row: ProgressPropertyRow }) {
  return (
    <div className="group flex items-baseline gap-2">
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
  );
}

export function SectionsRowCell({
  row,
}: { row: SectionsPropertyRow }) {
  return (
    <div className="group flex flex-col gap-1">
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
                <li key={entry.id}>{formatSectionEntry(entry)}</li>
              ))}
            </ul>
          )}
      </dd>
      <PropertyQuickFilterLink
        search={row.search}
        name={row.name}
      />
    </div>
  );
}

export function TextRowCell({
  row,
}: { row: TextPropertyRow }) {
  return (
    <div className="flex flex-col gap-1">
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
  );
}
