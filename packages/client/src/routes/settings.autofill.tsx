import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { ALL_CATEGORIES } from "../components/AutofillRulesToolbar";
import { AUTOFILL_SCOPE_LABELS, useAutofillScope } from "../hooks/useAutofillScope";
import { validateAutofillListSearch } from "../lib/autofillScope";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Settings → Autofill: the single home for autofill rules. Entity "Autofill Rules" tabs redirect
 * here pre-filtered to the entity they came from (`?scope=…&scopeSlug=…`). All filter state — the
 * entity scope, the category dropdown (`?category`), and the text search (`?q`) — lives in the URL so
 * the filtered view is a shareable, reload-safe deeplink.
 */
export const Route = createFileRoute("/settings/autofill")({
  validateSearch: validateAutofillListSearch,
  component: AutofillSettingsPage,
});

function AutofillSettingsPage() {
  const {
    scope, scopeSlug, category, q,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    active, label, listProps,
  } = useAutofillScope(scope, scopeSlug);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Autofill Rules</h2>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={q ?? ""}
          placeholder="Search rules…"
          aria-label="Search autofill rules"
          className="w-64"
          onChange={event => navigate({
            search: prev => ({
              ...prev,
              q: event.target.value || undefined,
            }),
            replace: true,
          })}
        />
        {active && scope
          ? (
            <span
              className="
                inline-flex items-center gap-1 rounded-full border bg-muted py-1
                pr-1 pl-3 text-sm
              "
            >
              <span className="text-muted-foreground">
                Filtered to {AUTOFILL_SCOPE_LABELS[scope]}:
              </span>
              <span className="font-medium">{label ?? scopeSlug}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 rounded-full"
                aria-label="Clear filter"
                onClick={() => navigate({
                  search: prev => ({
                    ...prev,
                    scope: undefined,
                    scopeSlug: undefined,
                  }),
                  replace: true,
                })}
              >
                <X className="size-3.5" />
              </Button>
            </span>
          )
          : null}
      </div>

      <AutofillRulesList
        {...listProps}
        query={q ?? ""}
        categoryFilter={category ?? ALL_CATEGORIES}
        onCategoryFilterChange={value => navigate({
          search: prev => ({
            ...prev,
            category: value === ALL_CATEGORIES ? undefined : value,
          }),
          replace: true,
        })}
      />
    </section>
  );
}
