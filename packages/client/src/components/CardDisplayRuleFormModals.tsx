import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CardDisplayRuleFormModalsProps {
  isDefault: boolean;
  displayModalOpen: boolean;
  onDisplayOpenChange: (open: boolean) => void;
  ruleModalOpen: boolean;
  onRuleOpenChange: (open: boolean) => void;
  /** Builds the display controls + preview; only invoked while the display modal is open. */
  renderDisplay: () => React.ReactNode;
  generalFields: React.ReactNode;
  whenFields: React.ReactNode;
}

/**
 * The two "expand to a modal" dialogs for the rule form (Display, and General+When). Kept separate so
 * the parent form stays a flat wiring component. Each dialog renders its body only while open so the
 * same inputs / DnD ids are never mounted twice (the inline copy shows a placeholder meanwhile).
 */
export function CardDisplayRuleFormModals({
  isDefault, displayModalOpen, onDisplayOpenChange, ruleModalOpen, onRuleOpenChange,
  renderDisplay, generalFields, whenFields,
}: CardDisplayRuleFormModalsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <Dialog
        open={displayModalOpen}
        onOpenChange={onDisplayOpenChange}
      >
        <DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Display settings")}</DialogTitle>
          </DialogHeader>
          {displayModalOpen ? renderDisplay() : null}
        </DialogContent>
      </Dialog>

      {isDefault
        ? null
        : (
          <Dialog
            open={ruleModalOpen}
            onOpenChange={onRuleOpenChange}
          >
            <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("Rule settings")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">{t("General")}</h3>
                  {ruleModalOpen ? generalFields : null}
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">{t("When")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("Which bookmarks this rule applies to. Combine conditions with AND/OR.")}
                  </p>
                  {ruleModalOpen ? whenFields : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </>
  );
}
