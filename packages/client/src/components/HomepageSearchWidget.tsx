import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/uiStore";

/**
 * Homepage "Search from Homepage" widget: a text box that, on submit, applies the query as the
 * bookmark search and navigates to the Bookmarks page (which reads the same `headerSearchQuery`
 * store value and shows the filtered results).
 */
export function HomepageSearchWidget() {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setHeaderSearchQuery(trimmed);
    void navigate({
      to: "/bookmarks",
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2"
      role="search"
    >
      <Input
        type="search"
        placeholder={t("Search bookmarks…")}
        aria-label={t("Search bookmarks")}
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button
        type="submit"
        variant="secondary"
        size="icon"
        aria-label={t("Search")}
      >
        <Search className="size-4" />
      </Button>
    </form>
  );
}
