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

import { useState } from "react";

import { IsbnLinksPanel } from "./IsbnLinksPanel";
import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";
import { RatingValue } from "./RatingValue";
import { SectionCollapseToggle } from "./SectionCollapseToggle";
import { SectionsSummary } from "./SectionsSummary";
import i18n from "../i18n";
import { sectionEntryLink, sectionEntryPositional } from "../lib/propertyFormat";

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
      <dd className="flex items-center gap-1.5">
        <RatingValue
          display={row.display}
          value={row.value}
          rangeEnd={row.valueEnd}
          rangeIncludeStart={row.rangeIncludeStart}
          max={row.max}
          allowHalf={row.allowHalf}
          readOnly
          label={row.label}
          size={16}
        />
        {row.caption ? <span className="text-xs text-muted-foreground">{row.caption}</span> : null}
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

/** Ticked/unticked from the view surfaces — save wiring is the caller's (`onToggleCompleted`). */
function SectionCompletedToggle({
  entry, onToggleCompleted,
}: {
  entry: SectionEntry;
  onToggleCompleted: (entryId: string, completed: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      className="size-3.5 cursor-pointer accent-primary"
      checked={entry.completed === true}
      aria-label={i18n.t("Completed")}
      title={i18n.t("Click to mark completed")}
      onChange={event => onToggleCompleted(entry.id, event.target.checked)}
    />
  );
}

/**
 * One section entry: its name (a link when {@link sectionEntryLink} resolves), the positional value
 * (page range / timestamp) beside it, and — for a tier-1 entry — an indented nested list of its
 * children. Recurses exactly once; the model caps sections at depth 2 (children carry no `children`),
 * so this never renders a third tier. The single source of truth for section display, used by both
 * `SectionsRowCell` and the flat `BookmarkPropertySections`. With `onToggleCompleted` wired, each
 * entry gets a clickable done-checkbox (ticking a section ticks its sub-items server-side); a
 * completed entry renders struck through.
 */
function SectionEntryItem({
  entry, onToggleCompleted,
}: {
  entry: SectionEntry;
  onToggleCompleted?: (entryId: string, completed: boolean) => void;
}) {
  const link = sectionEntryLink(entry);
  const positional = sectionEntryPositional(entry);
  const done = entry.completed === true;
  const hasChildren = !!entry.children && entry.children.length > 0;
  const [collapsed, setCollapsed] = useState(false);
  const name = entry.name || i18n.t("section");
  return (
    <li>
      <span className={done ? "line-through opacity-60" : undefined}>
        <span
          className="
            inline-flex size-4 items-center justify-center align-middle
          "
          aria-hidden={hasChildren ? undefined : true}
        >
          {hasChildren
            ? (
              <SectionCollapseToggle
                collapsed={collapsed}
                onToggle={() => setCollapsed(prev => !prev)}
                label={collapsed
                  ? i18n.t("Expand {{name}}", {
                    name,
                  })
                  : i18n.t("Collapse {{name}}", {
                    name,
                  })}
              />
            )
            : null}
        </span>
        {" "}
        {onToggleCompleted
          ? (
            <SectionCompletedToggle
              entry={entry}
              onToggleCompleted={onToggleCompleted}
            />
          )
          : null}
        {onToggleCompleted ? " " : null}
        {link
          ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {entry.name || link}
            </a>
          )
          : <span>{entry.name}</span>}
        {positional
          ? <span className="ml-2 text-muted-foreground">{positional}</span>
          : null}
        {hasChildren && collapsed
          ? (
            <span className="ml-2">
              <SectionsSummary sections={[entry]} />
            </span>
          )
          : null}
      </span>
      {hasChildren && !collapsed
        ? (
          <ul className="ml-4 space-y-0.5 border-l pl-2 text-muted-foreground">
            {entry.children?.map((child: SectionEntry) => (
              <SectionEntryItem
                key={child.id}
                entry={child}
                onToggleCompleted={onToggleCompleted}
              />
            ))}
          </ul>
        )
        : null}
    </li>
  );
}

/** A section value's entries as a two-tier list with clickable per-item links, or an empty state. */
export function SectionEntryList({
  sections, onToggleCompleted,
}: {
  sections: SectionEntry[];
  /** When set, each entry renders a clickable done-checkbox that calls back with its id. */
  onToggleCompleted?: (entryId: string, completed: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (sections.length === 0) {
    return <span className="text-xs text-muted-foreground">{i18n.t("No sections")}</span>;
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-sm">
        <SectionCollapseToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed(prev => !prev)}
          label={collapsed ? i18n.t("Expand all sections") : i18n.t("Collapse all sections")}
        />
        {collapsed
          ? <SectionsSummary sections={sections} />
          : null}
      </div>
      {collapsed
        ? null
        : (
          <ul className="space-y-0.5 text-sm">
            {sections.map(entry => (
              <SectionEntryItem
                key={entry.id}
                entry={entry}
                onToggleCompleted={onToggleCompleted}
              />
            ))}
          </ul>
        )}
    </div>
  );
}

export function SectionsRowCell({
  row, onToggleCompleted,
}: {
  row: SectionsPropertyRow;
  /** When set, the entries' done-checkboxes are clickable in view (mirrors `onSaveBoolean`). */
  onToggleCompleted?: (propertyId: string, entryId: string, completed: boolean) => void;
}) {
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
        <SectionEntryList
          sections={row.sections}
          onToggleCompleted={onToggleCompleted
            ? (entryId, completed) => onToggleCompleted(row.id, entryId, completed)
            : undefined}
        />
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
