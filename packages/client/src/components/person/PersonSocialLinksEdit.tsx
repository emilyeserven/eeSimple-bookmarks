import type { Person, SocialLink, UpdatePersonInput } from "@eesimple/types";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../../hooks/useFieldAutoSave";
import { useDetectPersonSocialLinks, useUpdatePerson } from "../../hooks/usePeople";
import { notifySuccess } from "../../lib/notifications";
import { SOCIAL_MEDIA_PLATFORM_LABELS, socialLinkSchema } from "../../lib/socialLinks";
import { SocialLinksField } from "../SocialLinksField";

import { Button } from "@/components/ui/button";

interface Props {
  person: Person;
}

const SOCIAL_LINKS_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  socialLinks: "Social media links",
};

const socialLinksFieldSchema = z.array(socialLinkSchema);

/**
 * The person's social links (the `socialLinks` field): a "Detect from website" button + the per-platform
 * URL rows. Auto-saves the whole array on change; detection merges new platforms and saves.
 */
export function PersonSocialLinksEdit({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const update = useUpdatePerson();
  const detectLinks = useDetectPersonSocialLinks();
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: SOCIAL_LINKS_LABELS,
    initial: {
      socialLinks: person.socialLinks,
    },
  });
  const hasSource = person.labeledWebsites.some(w => w.url.trim().length > 0);

  function saveSocialLinks(links: SocialLink[]): void {
    autoSave.saveField("socialLinks", links, {
      valid: socialLinksFieldSchema.safeParse(links).success,
    });
  }

  function detectSocialLinks(): void {
    detectLinks.mutate(person.id, {
      onSuccess: ({
        detected,
      }) => {
        if (detected.length === 0) {
          notifySuccess(t("No new social links found on the person's website"));
          return;
        }
        const existingPlatforms = new Set(person.socialLinks.map(l => l.platform));
        const toAdd = detected.filter(l => !existingPlatforms.has(l.platform));
        if (toAdd.length === 0) {
          notifySuccess(t("Social links already up to date"));
          return;
        }
        const merged = [...person.socialLinks, ...toAdd];
        saveSocialLinks(merged);
        const names = toAdd.map(l => SOCIAL_MEDIA_PLATFORM_LABELS[l.platform]).join(", ");
        notifySuccess(`Found ${toAdd.length === 1 ? "a link" : "links"}: ${names}`);
      },
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={detectLinks.isPending || !hasSource}
        onClick={detectSocialLinks}
      >
        <Sparkles className="size-4" />
        {t("Detect social links from website")}
      </Button>
      <SocialLinksField
        socialLinks={person.socialLinks}
        onChange={saveSocialLinks}
      />
    </div>
  );
}
