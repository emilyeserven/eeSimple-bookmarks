import type { AutofillListSearch } from "../lib/autofillScope";

import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";

import { FacetSelect } from "../components/AutofillRulesFilterBar";
import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useAutofillFacets } from "../hooks/useAutofillScope";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useSetListingPage } from "../hooks/useListingPage";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { AUTOFILL_FACET_KEYS, NO_CATEGORY, validateAutofillListSearch } from "../lib/autofillScope";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";

export const Route = createFileRoute("/autofill/")({
  validateSearch: validateAutofillListSearch,
  component: AutofillListPage,
});

interface AutofillFilterSidebarProps {
  search: AutofillListSearch;
  onChange: (patch: Partial<AutofillListSearch>) => void;
}

function AutofillFilterSidebar({
  search, onChange,
}: AutofillFilterSidebarProps) {
  const {
    data: categories = [], isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties = [], isLoading: propertiesLoading,
  } = useCustomProperties();
  const {
    data: websites = [], isLoading: websitesLoading,
  } = useWebsites();
  const {
    data: mediaTypes = [], isLoading: mediaTypesLoading,
  } = useMediaTypes();
  const {
    data: tags = [], isLoading: tagsLoading,
  } = useTags();
  const {
    data: channels = [], isLoading: channelsLoading,
  } = useYouTubeChannels();

  const anyFacetActive = AUTOFILL_FACET_KEYS.some(key => search[key]);

  return (
    <aside className="flex flex-col gap-3">
      <Input
        type="search"
        value={search.q ?? ""}
        placeholder="Search rules…"
        aria-label="Search autofill rules"
        onChange={event => onChange({
          q: event.target.value || undefined,
        })}
      />

      <FacetSelect
        label="categories"
        value={search.category}
        loading={categoriesLoading}
        options={categories.map(category => ({
          value: category.slug,
          label: category.name,
        }))}
        onChange={value => onChange({
          category: value,
        })}
      >
        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
      </FacetSelect>

      <FacetSelect
        label="websites"
        value={search.website}
        loading={websitesLoading}
        options={websites.map(website => ({
          value: website.slug,
          label: website.siteName ?? website.domain,
        }))}
        onChange={value => onChange({
          website: value,
        })}
      />

      <FacetSelect
        label="tags"
        value={search.tag}
        loading={tagsLoading}
        options={tags.map(tag => ({
          value: tag.slug,
          label: tag.name,
        }))}
        onChange={value => onChange({
          tag: value,
        })}
      />

      <FacetSelect
        label="media types"
        value={search.mediaType}
        loading={mediaTypesLoading}
        options={mediaTypes.map(mediaType => ({
          value: mediaType.slug,
          label: mediaType.name,
        }))}
        onChange={value => onChange({
          mediaType: value,
        })}
      />

      <FacetSelect
        label="channels"
        value={search.channel}
        loading={channelsLoading}
        options={channels.map(channel => ({
          value: channel.slug,
          label: channel.name,
        }))}
        onChange={value => onChange({
          channel: value,
        })}
      />

      <FacetSelect
        label="properties"
        value={search.property}
        loading={propertiesLoading}
        options={properties.map(property => ({
          value: property.slug,
          label: property.name,
        }))}
        onChange={value => onChange({
          property: value,
        })}
      />

      {anyFacetActive
        ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => onChange({
              category: undefined,
              property: undefined,
              website: undefined,
              tag: undefined,
              mediaType: undefined,
              channel: undefined,
            })}
          >
            <X className="size-4" />
            Clear filters
          </Button>
        )
        : null}
    </aside>
  );
}

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    listProps, noCategory,
  } = useAutofillFacets(search);
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);

  function onChange(patch: Partial<AutofillListSearch>) {
    void navigate({
      search: prev => ({
        ...prev,
        ...patch,
      }),
      replace: true,
    });
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Autofill Rules</h2>
          {rules
            ? <Badge variant="secondary">{rules.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <div
        className="
          grid gap-6
          lg:grid-cols-[16rem_1fr]
        "
      >
        <AutofillFilterSidebar
          search={search}
          onChange={onChange}
        />

        <div>
          <AutofillRulesList
            {...listProps}
            noCategory={noCategory}
            query={search.q ?? ""}
          />
        </div>
      </div>

      {newRule.modal}
    </section>
  );
}
