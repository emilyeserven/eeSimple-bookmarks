import type { AutofillListSearch } from "../lib/autofillScope";
import type { ReactNode } from "react";

import { X } from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { ALL_CATEGORIES, AUTOFILL_FACET_KEYS, NO_CATEGORY } from "../lib/autofillScope";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacetSelectProps {
  /** Plural noun used in the trigger / "All …" item, e.g. "websites". */
  label: string;
  /** The current selection (a slug or a sentinel), or undefined for "All". */
  value: string | undefined;
  options: { value: string;
    label: string; }[];
  /** Called with the new value, or undefined when "All …" is chosen. */
  onChange: (value: string | undefined) => void;
  loading?: boolean;
  /** Extra items rendered above the entity options (e.g. a "No category" item). */
  children?: ReactNode;
}

/**
 * A single-select facet filter dropdown. The "All …" item maps to `undefined` (no filter); every other
 * value is passed through verbatim, so callers can use either slugs (URL-persisted) or ids (ephemeral).
 */
export function FacetSelect({
  label, value, options, onChange, loading, children,
}: FacetSelectProps) {
  return (
    <Select
      value={value ?? ALL_CATEGORIES}
      onValueChange={next => onChange(next === ALL_CATEGORIES ? undefined : next)}
    >
      <SelectTrigger
        aria-label={`Filter by ${label}`}
        className="w-48"
      >
        <SelectValue placeholder={loading ? "Loading…" : `All ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>All {label}</SelectItem>
        {children}
        {options.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface AutofillRulesFilterBarProps {
  search: AutofillListSearch;
  /** Merge a partial change into the URL search (each facet is a slug; `undefined` clears it). */
  onChange: (patch: Partial<AutofillListSearch>) => void;
}

/**
 * The Settings → Autofill filter bar: a text search plus one dropdown per filterable facet (category,
 * website, tag, media type, YouTube channel, custom property). Each dropdown writes its facet **slug**
 * to the URL; the facets combine (AND) because {@link AutofillRulesList} ANDs the resolved ids.
 */
export function AutofillRulesFilterBar({
  search, onChange,
}: AutofillRulesFilterBarProps) {
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
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="search"
        value={search.q ?? ""}
        placeholder="Search rules…"
        aria-label="Search autofill rules"
        className="w-64"
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
    </div>
  );
}
