import type { Language } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Languages, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HoverIconButton, StandardListingCard } from "./StandardListingCard";

import { Badge } from "@/components/ui/badge";
import { useLanguageName } from "@/lib/builtInName";

/** A single language listing card: body → its bookmarks page, with hover Edit / Info. */
export function LanguageCard({
  language,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  language: Language;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (shiftKey?: boolean) => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const languageName = useLanguageName();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Languages className="size-5 shrink-0 text-muted-foreground" />}
      title={languageName(language)}
      titleAdornment={language.builtIn
        ? <Badge variant="secondary">{t("Built-in")}</Badge>
        : undefined}
      subtitle={language.isoCode ?? undefined}
      count={language.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/languages/$languageSlug"
          params={{
            languageSlug: language.slug,
          }}
          title={t("View {{name}}", {
            name: languageName(language),
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/languages/$languageSlug/edit"
            params={{
              languageSlug: language.slug,
            }}
            title={t("Edit {{name}}", {
              name: language.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: language.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/languages/$languageSlug/info"
            params={{
              languageSlug: language.slug,
            }}
            title={t("View {{name}}", {
              name: language.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: language.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
