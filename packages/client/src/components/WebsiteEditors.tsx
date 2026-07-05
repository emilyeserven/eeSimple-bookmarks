import type { ParamRuleDraft } from "../lib/websiteForm";
import type { ShortenedLink } from "@eesimple/types";

import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

/** Editor for a website's verified shortened-link domains (with optional expansion templates). */
export function ShortenedLinksEditor({
  idBase, links, onChange,
}: { idBase: string;
  links: ShortenedLink[];
  onChange: (links: ShortenedLink[]) => void; }) {
  const {
    t,
  } = useTranslation();
  function update(index: number, patch: Partial<ShortenedLink>): void {
    onChange(links.map((link, i) => (i === index
      ? {
        ...link,
        ...patch,
      }
      : link)));
  }
  return (
    <LabeledSection
      title={t("Verified shortened links")}
      description={(
        <>
          {t("Short domains that resolve to this site (e.g. youtu.be). Use")}
          {" "}
          <code>{"{id}"}</code>
          {" "}
          {t("(first path segment) or")}
          {" "}
          <code>{"{path}"}</code>
          {" "}
          {t("in the expansion template; leave it blank to keep links shortened.")}
        </>
      )}
    >
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className="
              grid gap-2 rounded-md border p-2
              sm:grid-cols-[1fr_2fr_auto_auto] sm:items-center
            "
          >
            <Input
              aria-label={t("Short domain")}
              placeholder="youtu.be"
              value={link.domain}
              onChange={event => update(index, {
                domain: event.target.value,
              })}
            />
            <Input
              aria-label={t("Expansion template")}
              placeholder="https://www.youtube.com/watch?v={id}"
              value={link.expandTo ?? ""}
              onChange={event => update(index, {
                expandTo: event.target.value,
              })}
            />
            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
              <Checkbox
                id={`keep-${idBase}-${index}`}
                checked={link.keepShortened}
                onCheckedChange={checked => update(index, {
                  keepShortened: checked === true,
                })}
              />
              {t("Keep shortened")}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Remove shortened link")}
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...links, {
            domain: "",
            expandTo: null,
            keepShortened: false,
          }])}
        >
          <Plus className="mr-1 size-4" />
          {t("Add shortened link")}
        </Button>
      </div>
    </LabeledSection>
  );
}

/** Editor for a website's path-scoped query-param whitelist. */
export function ParamRulesEditor({
  idBase, rules, onChange,
}: { idBase: string;
  rules: ParamRuleDraft[];
  onChange: (rules: ParamRuleDraft[]) => void; }) {
  const {
    t,
  } = useTranslation();
  function update(index: number, patch: Partial<ParamRuleDraft>): void {
    onChange(rules.map((rule, i) => (i === index
      ? {
        ...rule,
        ...patch,
      }
      : rule)));
  }
  return (
    <LabeledSection
      title={t("Keep-param rules")}
      description={t(
        "For URLs whose path ends with the suffix, keep only these query params (comma-separated) and strip the rest. Leave the path blank to match any path. With rules set, params aren’t kept unless whitelisted.",
      )}
    >
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="
              grid gap-2 rounded-md border p-2
              sm:grid-cols-[1fr_2fr_auto] sm:items-center
            "
          >
            <Input
              aria-label={t("Path suffix")}
              placeholder="/watch"
              value={rule.pathSuffix}
              onChange={event => update(index, {
                pathSuffix: event.target.value,
              })}
            />
            <Input
              aria-label={t("Kept params")}
              placeholder="v, list"
              value={rule.paramsText}
              onChange={event => update(index, {
                paramsText: event.target.value,
              })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Remove rule")}
              onClick={() => onChange(rules.filter((_, i) => i !== index))}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          id={`add-rule-${idBase}`}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rules, {
            pathSuffix: "",
            paramsText: "",
          }])}
        >
          <Plus className="mr-1 size-4" />
          {t("Add rule")}
        </Button>
      </div>
    </LabeledSection>
  );
}
