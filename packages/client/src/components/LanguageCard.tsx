import type { Language } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Languages, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { useLanguageName } from "@/lib/builtInName";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "language", language.id)}
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
            to="/taxonomies/languages/$languageSlug/general"
            params={{
              languageSlug: language.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "language", language.id, language.slug)}
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
