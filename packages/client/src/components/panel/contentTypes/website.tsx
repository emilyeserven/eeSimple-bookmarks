/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import { WithPanelItem } from "./status";
import { useWebsites } from "../../../hooks/useWebsites";
import { LabeledSection } from "../../LabeledSection";
import { WebsiteCard } from "../../WebsiteCard";
import { WebsiteGeneralForm } from "../../WebsiteGeneralForm";
import { WebsiteParamRulesForm } from "../../WebsiteParamRulesForm";
import { WebsiteShortenedLinksForm } from "../../WebsiteShortenedLinksForm";
import { PanelEntityEditor } from "../PanelEntityEditor";

import { Separator } from "@/components/ui/separator";

function useWebsiteList() {
  const {
    data, isLoading, error,
  } = useWebsites();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(website => ({
      id: website.id,
      label: website.siteName,
      sublabel: website.domain,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only website view, reusing the same `WebsiteCard` the view page renders. */
function WebsiteView({
  id,
}: {
  id: string;
}) {
  const query = useWebsites();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Website not found."
    >
      {website => <WebsiteCard website={website} />}
    </WithPanelItem>
  );
}

/**
 * Website editor, reusing the same auto-save forms the edit tabs render — stacked here since the
 * panel is a single column. This gives the panel full parity (category / media type / default tags /
 * favicon, plus param rules and shortened links), which the old panel-only `WebsiteRow` lacked.
 */
function WebsiteEdit({
  id,
}: {
  id: string;
}) {
  const query = useWebsites();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Website not found."
    >
      {website => (
        <PanelEntityEditor
          name={website.siteName}
          builtIn={website.builtIn}
        >
          <div className="space-y-6">
            <LabeledSection
              title="General"
              description="Site name and domain."
            >
              <WebsiteGeneralForm website={website} />
            </LabeledSection>
            <Separator />
            <LabeledSection
              title="Param Rules"
              description="Path-scoped query-param whitelist: only listed params are kept, the rest are stripped."
            >
              <WebsiteParamRulesForm website={website} />
            </LabeledSection>
            <Separator />
            <LabeledSection
              title="Shortened Links"
              description="Short domains that resolve to this site and how they expand."
            >
              <WebsiteShortenedLinksForm website={website} />
            </LabeledSection>
          </div>
        </PanelEntityEditor>
      )}
    </WithPanelItem>
  );
}

export const websiteContentType: PanelContentTypeDef = {
  type: "website",
  label: "Websites",
  singular: "Website",
  icon: Globe,
  useList: useWebsiteList,
  View: WebsiteView,
  Edit: WebsiteEdit,
};
