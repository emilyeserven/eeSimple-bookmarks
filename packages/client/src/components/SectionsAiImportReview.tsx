import type { SectionsImportPayload, TagReviewItem } from "../lib/sectionsAiImport";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

/** "12 sections, 34 sub-sections" (sub-section part omitted when there are none). */
function SectionsCountLine({
  payload,
}: { payload: SectionsImportPayload }) {
  const {
    t,
  } = useTranslation();
  const subCount = payload.sections.reduce((sum, section) => sum + (section.children?.length ?? 0), 0);
  return (
    <p className="text-sm font-medium">
      {t("{{count}} sections", {
        count: payload.sections.length,
      })}
      {subCount > 0
        ? `, ${t("{{count}} sub-sections", {
          count: subCount,
        })}`
        : null}
    </p>
  );
}

/** A compact read-only "name — p. start–end" preview of the parsed sections (children indented). */
function SectionsPreviewList({
  payload,
}: { payload: SectionsImportPayload }) {
  function pages(section: { startPage?: number;
    endPage?: number; }): string | null {
    if (section.startPage === undefined) return null;
    return section.endPage !== undefined
      ? `p. ${section.startPage}–${section.endPage}`
      : `p. ${section.startPage}`;
  }
  return (
    <ul className="max-h-48 space-y-0.5 overflow-y-auto text-sm">
      {payload.sections.map((section, index) => (
        <li key={`${section.name}-${index}`}>
          <span>{section.name}</span>
          {pages(section)
            ? <span className="ml-2 text-muted-foreground">{pages(section)}</span>
            : null}
          {section.children && section.children.length > 0
            ? (
              <ul
                className="ml-4 space-y-0.5 border-l pl-2 text-muted-foreground"
              >
                {section.children.map((child, childIndex) => (
                  <li key={`${child.name}-${childIndex}`}>
                    <span>{child.name}</span>
                    {pages(child)
                      ? <span className="ml-2">{pages(child)}</span>
                      : null}
                  </li>
                ))}
              </ul>
            )
            : null}
        </li>
      ))}
    </ul>
  );
}

/** One suggested-tag review row: accept checkbox, name, Reused/New badge, rename + placement. */
function TagReviewRow({
  item, accepted, onToggleReject, rename, onRename, fallbackParentName,
}: {
  item: TagReviewItem;
  accepted: boolean;
  onToggleReject: (name: string) => void;
  rename: string | undefined;
  onRename: (name: string, next: string) => void;
  fallbackParentName: string | null;
}) {
  const {
    t,
  } = useTranslation();
  const isNew = item.existingTagId === undefined;
  const parentName = item.proposedParentName ?? fallbackParentName;
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Checkbox
        id={`ai-import-tag-${item.name}`}
        checked={accepted}
        onCheckedChange={() => onToggleReject(item.name)}
      />
      <label
        htmlFor={`ai-import-tag-${item.name}`}
        className="text-sm"
      >
        {item.name}
      </label>
      <Badge variant={isNew ? "default" : "secondary"}>
        {isNew ? t("New") : t("Reused")}
      </Badge>
      {isNew && accepted
        ? (
          <>
            <Input
              className="h-8 w-44"
              aria-label={t("Rename {{name}}", {
                name: item.name,
              })}
              value={rename ?? item.name}
              onChange={event => onRename(item.name, event.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              {t("under {{parent}}", {
                parent: parentName ?? t("(root)"),
              })}
            </span>
          </>
        )
        : null}
    </li>
  );
}

/**
 * The review block of the Sections AI-import dialog: a parsed-sections preview plus one row per
 * distinct suggested tag. Unchecking a tag rejects it — it is removed from every section and (for a
 * new tag) never created; a New tag's name can be edited before creation and shows where it will be
 * placed. Presentational only — every decision lives in the `useSectionsAiImport` controller.
 */
export function SectionsAiImportReview({
  payload, tagReview, rejected, onToggleReject, renames, onRename, fallbackParentName,
}: {
  payload: SectionsImportPayload;
  tagReview: TagReviewItem[];
  rejected: Set<string>;
  onToggleReject: (name: string) => void;
  renames: Record<string, string>;
  onRename: (name: string, next: string) => void;
  fallbackParentName: string | null;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <SectionsCountLine payload={payload} />
      <SectionsPreviewList payload={payload} />
      {tagReview.length > 0
        ? (
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-sm font-medium">{t("Suggested tags")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Uncheck a tag to leave it off every section. New tags can be renamed before they are created.")}
            </p>
            <ul className="space-y-1.5">
              {tagReview.map(item => (
                <TagReviewRow
                  key={item.name}
                  item={item}
                  accepted={!rejected.has(item.name)}
                  onToggleReject={onToggleReject}
                  rename={renames[item.name]}
                  onRename={onRename}
                  fallbackParentName={fallbackParentName}
                />
              ))}
            </ul>
          </div>
        )
        : null}
    </div>
  );
}
