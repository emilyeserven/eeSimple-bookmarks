import type { AutofillListSearch } from "../lib/autofillScope";
import type { AutofillRule } from "@eesimple/types";

import { useEffect, useMemo } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AutofillFilterSidebar } from "../components/AutofillFilterSidebar";
import { ruleMatchesFacets } from "../components/autofillRulesFacets";
import { ListingScaffold } from "../components/ListingScaffold";
import { buildAutofillListingConfig } from "../entities/autofillRule";
import { useAutofillRules } from "../hooks/useAutofill";
import { useAutofillFacets } from "../hooks/useAutofillScope";
import { useSetListingPage } from "../hooks/useListingPage";
import { useListingScaffold } from "../hooks/useListingScaffold";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import { validateAutofillListSearch } from "../lib/autofillScope";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

export const Route = createFileRoute("/autofill/")({
  validateSearch: validateAutofillListSearch,
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: rules,
  } = useAutofillRules();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    listProps, noCategory,
  } = useAutofillFacets(search);
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", {
    createAction: newRule.openModal,
    createLabel: t("New rule"),
  });

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, channelId,
  } = listProps;
  const websiteDomain = useWebsiteDomain(websiteId);

  const matchesFacets = useMemo(
    () => (rule: AutofillRule) => ruleMatchesFacets(rule, {
      categoryId,
      propertyId,
      websiteId,
      tagId,
      mediaTypeId,
      channelId,
      noCategory,
    }, websiteDomain),
    [categoryId, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, channelId, noCategory],
  );
  const config = useMemo(() => buildAutofillListingConfig({
    matchesFacets,
  }), [matchesFacets]);
  const state = useListingScaffold(config);

  // Legacy `?q=` deeplinks: the text search moved to the header search box, so seed the query into
  // it and strip `q` from the URL (it stays accepted by `validateAutofillListSearch`). This effect
  // sits after `useListingScaffold` on purpose: `useRegisterHeaderSearch` clears the query in its
  // unmount cleanup, so under StrictMode's mount → cleanup → remount the seed must re-run on the
  // second mount (keyed on `search.q`, which the async navigate hasn't stripped yet) — a run-once
  // ref here would leave the query wiped.
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  useEffect(() => {
    if (!search.q) return;
    setHeaderSearchQuery(search.q);
    void navigate({
      search: prev => ({
        ...prev,
        q: undefined,
      }),
      replace: true,
    });
  }, [search.q, setHeaderSearchQuery, navigate]);

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
          <h2 className="text-xl font-semibold">{t("Autofill Rules")}</h2>
          {rules
            ? <Badge variant="secondary">{rules.length}</Badge>
            : null}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <Link to="/autofill/backfill">{t("Backfill")}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Define rules that match a bookmark's title or website and prefill its category, tags, and custom properties when you add it. Select a rule to edit it, or create a new one.")}
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
          <ListingScaffold
            config={config}
            state={state}
          />
        </div>
      </div>

      {newRule.modal}
    </section>
  );
}
