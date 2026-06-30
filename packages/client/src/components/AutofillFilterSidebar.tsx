import type { AutofillListSearch } from "../lib/autofillScope";

import { X } from "lucide-react";

import { FacetSelect } from "./AutofillRulesFilterBar";
import { useAutofillFilterData } from "../hooks/useAutofillScope";
import { AUTOFILL_FACET_KEYS, NO_CATEGORY } from "../lib/autofillScope";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";

interface AutofillFilterSidebarProps {
  search: AutofillListSearch;
  onChange: (patch: Partial<AutofillListSearch>) => void;
}

/** The autofill-rules listing filter rail: a search box plus a facet select per scopable entity. */
export function AutofillFilterSidebar({
  search, onChange,
}: AutofillFilterSidebarProps) {
  const {
    categories, properties, websites, mediaTypes, tags, channels,
  } = useAutofillFilterData();

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
        loading={categories.loading}
        options={categories.options}
        onChange={value => onChange({
          category: value,
        })}
      >
        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
      </FacetSelect>

      <FacetSelect
        label="websites"
        value={search.website}
        loading={websites.loading}
        options={websites.options}
        onChange={value => onChange({
          website: value,
        })}
      />

      <FacetSelect
        label="tags"
        value={search.tag}
        loading={tags.loading}
        options={tags.options}
        onChange={value => onChange({
          tag: value,
        })}
      />

      <FacetSelect
        label="media types"
        value={search.mediaType}
        loading={mediaTypes.loading}
        options={mediaTypes.options}
        onChange={value => onChange({
          mediaType: value,
        })}
      />

      <FacetSelect
        label="channels"
        value={search.channel}
        loading={channels.loading}
        options={channels.options}
        onChange={value => onChange({
          channel: value,
        })}
      />

      <FacetSelect
        label="properties"
        value={search.property}
        loading={properties.loading}
        options={properties.options}
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
