import type { ScanPipelineReport } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ChipRow({
  label, items,
}: { label: string;
  items: string[]; }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map(item => (
          <Badge
            key={item}
            variant="secondary"
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/**
 * The data-driven registries the pipeline consults, resolved live by the server: the keyless
 * oEmbed providers, the detectable content kinds, and the generic ISBN HTML extraction strategies
 * (an ordered list — earlier strategies win).
 */
export function ScanPipelineRegistriesCard({
  registries,
}: { registries: ScanPipelineReport["registries"] }) {
  const {
    t,
  } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Registries")}</CardTitle>
        <CardDescription>
          {t(
            "The data-driven lists the pipeline consults. These come from the server's registries, so this page always reflects what is actually deployed.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChipRow
          label={t("oEmbed providers")}
          items={registries.oembedProviders.map(p => p.name)}
        />
        <ChipRow
          label={t("Detectable content kinds (in detection-priority order)")}
          items={registries.contentKinds}
        />
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("Generic ISBN extraction strategies (tried in order)")}
          </p>
          <ol
            className="
              mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground
            "
          >
            {registries.isbnHtmlStrategies.map(strategy => <li key={strategy}>{strategy}</li>)}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
