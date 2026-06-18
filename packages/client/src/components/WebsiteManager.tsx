import type { BulkUrlUpdateResult, ShortenedLink, UpdateWebsiteInput, Website, WebsiteParamRule } from "@eesimple/types";

import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, X } from "lucide-react";
import { z } from "zod";

import { LabeledSection } from "./LabeledSection";
import { LinkPreview } from "./LinkPreview";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import { useBookmarksOnHost, useBulkExpandBookmarkUrls } from "../hooks/useBookmarks";
import { useCreateWebsite, useUpdateWebsite, useWebsites } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";
import { canonicalize } from "../lib/urlCleanup";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";
import { Separator } from "@/components/ui/separator";

/** Local draft of a param rule, with params edited as a comma-separated string. */
interface ParamRuleDraft {
  pathSuffix: string;
  paramsText: string;
}

/** Normalize shortened-link drafts to the stored shape (lower-cased domains, blank expandTo → null). */
function normalizeShortLinks(links: ShortenedLink[]): ShortenedLink[] {
  return links
    .map(link => ({
      domain: link.domain.trim().replace(/^www\./i, "").toLowerCase(),
      expandTo: link.expandTo && link.expandTo.trim() ? link.expandTo.trim() : null,
      keepShortened: link.keepShortened,
    }))
    .filter(link => link.domain.length > 0);
}

/** Normalize param-rule drafts to the stored shape, dropping fully-empty rows. */
function normalizeRules(rules: ParamRuleDraft[]): WebsiteParamRule[] {
  return rules
    .map(rule => ({
      pathSuffix: rule.pathSuffix.trim(),
      params: rule.paramsText.split(",").map(part => part.trim()).filter(Boolean),
    }))
    .filter(rule => rule.pathSuffix.length > 0 || rule.params.length > 0);
}

/** A single editable website row: name/domain plus shortened-link and param-cleanup rules. */
export function WebsiteRow({
  website,
  onSaved,
}: { website: Website;
  onSaved?: () => void; }) {
  const updateWebsite = useUpdateWebsite();
  const [siteName, setSiteName] = useState(website.siteName);
  const [domain, setDomain] = useState(website.domain);
  const [shortLinks, setShortLinks] = useState<ShortenedLink[]>(website.shortenedLinks);
  const [rules, setRules] = useState<ParamRuleDraft[]>(() =>
    website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    })));

  const payloadShortLinks = normalizeShortLinks(shortLinks);
  const payloadRules = normalizeRules(rules);
  const stored = {
    shortLinks: normalizeShortLinks(website.shortenedLinks),
    rules: normalizeRules(website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    }))),
  };

  const dirty
    = (!website.builtIn && (siteName.trim() !== website.siteName || domain.trim() !== website.domain))
      || JSON.stringify(payloadShortLinks) !== JSON.stringify(stored.shortLinks)
      || JSON.stringify(payloadRules) !== JSON.stringify(stored.rules);
  const valid = siteName.trim().length > 0 && domain.trim().length > 0;

  // A live website built from the current (unsaved) edits, used to preview canonicalization.
  const editedWebsite: Website = {
    ...website,
    siteName: siteName.trim() || website.siteName,
    domain: domain.trim() || website.domain,
    shortenedLinks: payloadShortLinks,
    paramRules: payloadRules,
  };

  function save(): void {
    if (!dirty || !valid) return;
    const input: UpdateWebsiteInput = {
      shortenedLinks: payloadShortLinks,
      paramRules: payloadRules,
    };
    if (!website.builtIn) {
      input.siteName = siteName.trim();
      input.domain = domain.trim();
    }
    updateWebsite.mutate(
      {
        id: website.id,
        input,
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  const expandableLinks = website.shortenedLinks.filter(link => link.expandTo && !link.keepShortened);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_1fr_auto] sm:items-end
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`site-name-${website.id}`}>Site name</Label>
            <Input
              id={`site-name-${website.id}`}
              value={siteName}
              disabled={website.builtIn}
              onChange={event => setSiteName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`site-domain-${website.id}`}>Domain</Label>
            <Input
              id={`site-domain-${website.id}`}
              value={domain}
              disabled={website.builtIn}
              onChange={event => setDomain(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid || updateWebsite.isPending}
            onClick={save}
          >
            {updateWebsite.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {website.builtIn
          ? (
            <p className="text-xs text-muted-foreground">
              Built-in site — its name and domain are fixed, but you can edit its rules below.
            </p>
          )
          : null}
      </div>

      <Separator />

      <ShortenedLinksEditor
        idBase={website.id}
        links={shortLinks}
        onChange={setShortLinks}
      />

      <Separator />

      <ParamRulesEditor
        idBase={website.id}
        rules={rules}
        onChange={setRules}
      />

      <Separator />

      <LabeledSection
        title="Preview"
        description="Uses the edits above."
      >
        <LinkPreview
          websites={[editedWebsite]}
          ignoreList={[]}
          label=""
          placeholder="Paste a link on this site…"
        />
      </LabeledSection>

      {expandableLinks.length > 0
        ? (
          <>
            <Separator />
            <BulkExpandSection website={website} />
          </>
        )
        : null}

      {updateWebsite.isError
        ? <p className="text-sm text-destructive">{updateWebsite.error.message}</p>
        : null}
    </div>
  );
}

/** Editor for a website's verified shortened-link domains (with optional expansion templates). */
function ShortenedLinksEditor({
  idBase, links, onChange,
}: { idBase: string;
  links: ShortenedLink[];
  onChange: (links: ShortenedLink[]) => void; }) {
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
      title="Verified shortened links"
      description={(
        <>
          Short domains that resolve to this site (e.g. youtu.be). Use
          {" "}
          <code>{"{id}"}</code>
          {" "}
          (first path segment) or
          {" "}
          <code>{"{path}"}</code>
          {" "}
          in the expansion template; leave it blank to keep links shortened.
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
              aria-label="Short domain"
              placeholder="youtu.be"
              value={link.domain}
              onChange={event => update(index, {
                domain: event.target.value,
              })}
            />
            <Input
              aria-label="Expansion template"
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
              Keep shortened
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove shortened link"
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
          Add shortened link
        </Button>
      </div>
    </LabeledSection>
  );
}

/** Editor for a website's path-scoped query-param whitelist. */
function ParamRulesEditor({
  idBase, rules, onChange,
}: { idBase: string;
  rules: ParamRuleDraft[];
  onChange: (rules: ParamRuleDraft[]) => void; }) {
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
      title="Keep-param rules"
      description="For URLs whose path ends with the suffix, keep only these query params (comma-separated) and strip the rest. Leave the path blank to match any path. With rules set, params aren’t kept unless whitelisted."
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
              aria-label="Path suffix"
              placeholder="/watch"
              value={rule.pathSuffix}
              onChange={event => update(index, {
                pathSuffix: event.target.value,
              })}
            />
            <Input
              aria-label="Kept params"
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
              aria-label="Remove rule"
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
          Add rule
        </Button>
      </div>
    </LabeledSection>
  );
}

/** Lists the website's saved shortened links that have an expansion rule, each with a bulk-expander. */
function BulkExpandSection({
  website,
}: { website: Website }) {
  const expandable = website.shortenedLinks.filter(link => link.expandTo && !link.keepShortened);
  if (expandable.length === 0) return null;
  return (
    <LabeledSection title="Expand existing bookmarks">
      {expandable.map(link => (
        <BulkExpandShortened
          key={link.domain}
          website={website}
          domain={link.domain}
        />
      ))}
    </LabeledSection>
  );
}

/** Review + bulk-apply the expansion of bookmarks saved on one shortened domain. */
function BulkExpandShortened({
  website, domain,
}: { website: Website;
  domain: string; }) {
  const [open, setOpen] = useState(false);
  const {
    data: bookmarks = [], isLoading,
  } = useBookmarksOnHost(open ? domain : null);
  const bulk = useBulkExpandBookmarkUrls();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BulkUrlUpdateResult[] | null>(null);

  // Compute the expanded form for each bookmark and keep only those that actually change.
  const items = bookmarks
    .map(bookmark => ({
      ...bookmark,
      after: canonicalize(bookmark.url, {
        mode: "none",
        websites: [website],
        ignoreList: [],
      }).url,
    }))
    .filter(item => item.after !== item.url);

  // Default every changed bookmark to selected once the list loads.
  useEffect(() => {
    setSelected(new Set(items.map(item => item.id)));
    setResults(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]);

  function toggle(id: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply(): void {
    const payload = items
      .filter(item => selected.has(item.id))
      .map(item => ({
        id: item.id,
        url: item.after,
      }));
    if (payload.length === 0) return;
    bulk.mutate(payload, {
      onSuccess: setResults,
    });
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">
          Review
          {" "}
          <span className="font-mono">{domain}</span>
          {" "}
          links to expand
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(value => !value)}
        >
          {open ? "Hide" : "Review"}
        </Button>
      </div>

      {open
        ? (
          <div className="mt-3 space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {!isLoading && items.length === 0
              ? <p className="text-sm text-muted-foreground">No bookmarks to expand.</p>
              : null}
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-md border p-2 text-sm"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={`Expand ${item.title}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p
                    className="truncate font-mono text-xs text-muted-foreground"
                  >{item.url}
                  </p>
                  <p className="truncate font-mono text-xs">→ {item.after}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Open expanded link in new tab"
                >
                  <a
                    href={item.after}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            ))}

            {items.length > 0
              ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={selected.size === 0 || bulk.isPending}
                  onClick={apply}
                >
                  {bulk.isPending ? "Applying…" : `Apply ${selected.size} selected`}
                </Button>
              )
              : null}

            {results
              ? (
                <p className="text-sm text-muted-foreground">
                  Applied
                  {" "}
                  {results.filter(result => result.status === "applied").length}
                  {", skipped "}
                  {results.filter(result => result.status !== "applied").length}
                  .
                </p>
              )
              : null}
          </div>
        )
        : null}
    </div>
  );
}

/** Read-only display card for a single website. Shared by the view page and the right panel's View body. */
export function WebsiteCard({
  website,
}: { website: Website }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{website.siteName}</h2>
          <a
            href={`https://${website.domain}`}
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center gap-1 text-sm text-muted-foreground
              hover:text-foreground hover:underline
            "
          >
            {website.domain}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/websites/$websiteSlug/edit"
            params={{
              websiteSlug: website.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "website", website.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Added</dt>
          <dd>{new Date(website.createdAt).toLocaleDateString()}</dd>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{website.slug}</dd>
          <dt className="text-muted-foreground">Built-in</dt>
          <dd>{website.builtIn ? "Yes — name & domain are fixed" : "No"}</dd>
          {website.bookmarkCount != null
            ? (
              <>
                <dt className="text-muted-foreground">Bookmarks</dt>
                <dd>{website.bookmarkCount}</dd>
              </>
            )
            : null}
        </dl>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Verified shortened links"
        description="Short domains that resolve to this site and how they expand."
      >
        {website.shortenedLinks.length === 0
          ? <p className="text-sm text-muted-foreground">None</p>
          : (
            <ul className="space-y-2 text-sm">
              {website.shortenedLinks.map(link => (
                <li
                  key={link.domain}
                  className="rounded-md border p-2"
                >
                  <span className="font-mono">{link.domain}</span>
                  {link.keepShortened || !link.expandTo
                    ? <span className="text-muted-foreground"> — kept shortened</span>
                    : (
                      <>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-mono">{link.expandTo}</span>
                      </>
                    )}
                </li>
              ))}
            </ul>
          )}
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Keep-param rules"
        description="For matching paths, only these query params are kept; the rest are stripped."
      >
        {website.paramRules.length === 0
          ? <p className="text-sm text-muted-foreground">None</p>
          : (
            <ul className="space-y-2 text-sm">
              {website.paramRules.map((rule, index) => (
                <li
                  key={index}
                  className="rounded-md border p-2"
                >
                  <span className="font-mono">{rule.pathSuffix || "any path"}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-mono">
                    {rule.params.length > 0 ? rule.params.join(", ") : "(none kept)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
      </LabeledSection>
    </div>
  );
}

/** Manage the built-in Websites taxonomy: list every known site and rename it. */
export function WebsiteManager() {
  const {
    data: websites, isLoading, error,
  } = useWebsites();

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading websites…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && websites && websites.length === 0
        ? (
          <p className="text-muted-foreground">
            No websites yet. They&apos;re created automatically when you add bookmarks.
          </p>
        )
        : null}

      {websites && websites.length > 0
        ? (
          <ul className="space-y-3">
            {websites.map(website => (
              <li
                key={website.id}
                className="rounded-lg border bg-card p-4"
              >
                <WebsiteRow website={website} />
              </li>
            ))}
          </ul>
        )
        : null}
    </section>
  );
}

const addWebsiteSchema = z.object({
  domain: z.string().trim().min(1, "Domain is required"),
  siteName: z.string().trim(),
});

/** Inline "add a website" form — websites are normally auto-created, this adds one by hand. */
function AddWebsiteForm() {
  const createWebsite = useCreateWebsite();

  const form = useAppForm({
    defaultValues: {
      domain: "",
      siteName: "",
    },
    validators: {
      onChange: addWebsiteSchema,
    },
    onSubmit: ({
      value,
    }) => {
      createWebsite.mutate(
        {
          domain: value.domain.trim(),
          siteName: value.siteName.trim() || undefined,
        },
        {
          onSuccess: () => form.reset(),
        },
      );
    },
  });

  return (
    <form
      className="rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_1fr_auto] sm:items-end
        "
      >
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              placeholder="example.com"
            />
          )}
        </form.AppField>
        <form.AppField name="siteName">
          {field => (
            <field.TextField
              label="Site name (optional)"
              placeholder="Defaults to the domain"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton
            label="Add website"
            pendingLabel="Adding…"
          />
        </form.AppForm>
      </div>
      {createWebsite.isError
        ? <p className="mt-2 text-sm text-destructive">{createWebsite.error.message}</p>
        : null}
    </form>
  );
}

/** Browsable, searchable website listing with add form. Shared by the Websites taxonomy page and the Settings Websites page. */
export function WebsitesListing() {
  const {
    data: allWebsites, isLoading, error,
  } = useWebsites();
  const [search, setSearch] = useState("");
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  const filtered = (allWebsites ?? []).filter((w) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return w.siteName.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AddWebsiteForm />

      <div className="space-y-4">
        <Input
          placeholder="Search by name or domain…"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="max-w-sm"
        />

        {isLoading ? <p className="text-muted-foreground">Loading websites…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (allWebsites?.length ?? 0) === 0
          ? (
            <p className="text-muted-foreground">
              No websites yet. They&apos;re created automatically when you add bookmarks.
            </p>
          )
          : null}
        {!isLoading && (allWebsites?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No websites match &ldquo;{search}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0
          ? (
            <ul className="space-y-2">
              {filtered.map(website => (
                <li
                  key={website.id}
                  className="group relative rounded-lg border bg-card"
                >
                  <Link
                    to="/taxonomies/websites/$websiteSlug"
                    params={{
                      websiteSlug: website.slug,
                    }}
                    className="
                      flex items-center gap-3 rounded-lg p-4 pr-12
                      transition-colors
                      hover:bg-accent
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{website.siteName}</p>
                      <p className="truncate text-sm text-muted-foreground">{website.domain}</p>
                    </div>
                    {website.bookmarkCount !== undefined
                      ? <Badge variant="secondary">{website.bookmarkCount}</Badge>
                      : null}
                  </Link>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="
                      absolute top-1/2 right-2 -translate-y-1/2 opacity-0
                      transition-opacity
                      group-hover:opacity-100
                      focus-visible:opacity-100
                    "
                  >
                    <Link
                      to="/taxonomies/websites/$websiteSlug/edit"
                      params={{
                        websiteSlug: website.slug,
                      }}
                      title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                      onClick={event => editClick(event, "website", website.id)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {website.siteName}</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )
          : null}
      </div>
    </div>
  );
}
