import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PanelEntityEditorProps {
  /** Entity display name shown in the header. */
  name: string;
  /** Optional leading icon for the header. */
  icon?: ReactNode;
  /** Renders a "Built-in" badge when true. */
  builtIn?: boolean;
  /** Optional actions rendered on the right of the header (e.g. a link to the full edit page). */
  actions?: ReactNode;
  /** Delete handler; omit to hide the Delete button (built-ins / non-deletable entities). */
  onDelete?: () => void;
  deleteIsPending?: boolean;
  deleteError?: string | null;
  /**
   * The entity's edit form(s) — the **same** auto-save `*GeneralForm` components the main-app edit
   * tabs render. The panel must reuse those here, never a panel-only editor.
   */
  children: ReactNode;
}

/**
 * Shared chrome for editing an entity inside the right panel: a header (name + built-in badge +
 * optional actions + Delete) over the entity's auto-save edit form(s). Modeled on `CategoryCard`,
 * the first surface to follow the right-panel parity rule — the panel **reuses the same per-field
 * auto-save edit forms the main-app edit tabs use**, rather than a divergent `*Row`/submit editor.
 */
export function PanelEntityEditor({
  name,
  icon,
  builtIn = false,
  actions,
  onDelete,
  deleteIsPending = false,
  deleteError,
  children,
}: PanelEntityEditorProps) {
  const showHeaderActions = actions != null || onDelete != null;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold">{name}</h2>
          {builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
        {showHeaderActions
          ? (
            <div className="flex items-center gap-2">
              {actions}
              {onDelete
                ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteIsPending}
                    onClick={onDelete}
                  >
                    {deleteIsPending ? "Deleting…" : "Delete"}
                  </Button>
                )
                : null}
            </div>
          )
          : null}
      </div>

      <Separator />

      {children}

      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
    </div>
  );
}
