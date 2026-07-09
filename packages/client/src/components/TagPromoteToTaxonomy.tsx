import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { usePromoteTagToTaxonomy } from "../hooks/useTaxonomies";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

/**
 * Edit-only tag field: promote this tag's subtree into its own taxonomy. The tag becomes the
 * taxonomy; its child tags become terms; each affected bookmark tag migrates to a taxonomy
 * assignment. On success it navigates to the new taxonomy's page. Blocked (422) tags surface the
 * server's reason as a toast (e.g. the tag or a descendant is a default tag on a website/channel).
 */
export function TagPromoteToTaxonomy({
  tagId,
}: { tagId: string }) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const promote = usePromoteTagToTaxonomy();

  return (
    <LabeledSection
      title={t("Promote to taxonomy")}
      description={t("Turn this tag into its own taxonomy — it gets its own sidebar item and bookmark picker, and its child tags become the taxonomy's terms. This can't be undone automatically (you can demote the taxonomy back into tags later).")}
    >
      <Button
        variant="outline"
        disabled={promote.isPending}
        onClick={() => promote.mutate(tagId, {
          onSuccess: (taxonomy) => {
            notifySuccess(t("Promoted to taxonomy"));
            void navigate({
              to: "/taxonomies/$taxonomyKey",
              params: {
                taxonomyKey: taxonomy.slug,
              },
            });
          },
          onError: (err: Error) => notifyError(err.message),
        })}
      >
        {t("Promote to taxonomy")}
      </Button>
    </LabeledSection>
  );
}
