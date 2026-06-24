import type { SocialLink, SocialMediaPlatform } from "@eesimple/types";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOCIAL_MEDIA_PLATFORM_LABELS, SOCIAL_MEDIA_PLATFORMS } from "@/lib/socialLinks";

interface Props {
  socialLinks: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

function linksToRecord(links: SocialLink[]): Record<SocialMediaPlatform, string> {
  const record = Object.fromEntries(
    SOCIAL_MEDIA_PLATFORMS.map(p => [p, ""]),
  ) as Record<SocialMediaPlatform, string>;
  for (const link of links) {
    record[link.platform] = link.url;
  }
  return record;
}

/** Controlled field rendering one URL input per social media platform. Commits on each blur. */
export function SocialLinksField({
  socialLinks,
  onChange,
}: Props) {
  const [draft, setDraft] = useState<Record<SocialMediaPlatform, string>>(
    () => linksToRecord(socialLinks),
  );

  function handleBlur(platform: SocialMediaPlatform, value: string) {
    const next = {
      ...draft,
      [platform]: value.trim(),
    };
    setDraft(next);
    const links: SocialLink[] = SOCIAL_MEDIA_PLATFORMS
      .filter(p => next[p].length > 0)
      .map(p => ({
        platform: p,
        url: next[p],
      }));
    onChange(links);
  }

  return (
    <div className="space-y-3">
      {SOCIAL_MEDIA_PLATFORMS.map(platform => (
        <div
          key={platform}
          className="flex flex-col gap-1.5"
        >
          <Label htmlFor={`social-${platform}`}>
            {SOCIAL_MEDIA_PLATFORM_LABELS[platform]}
          </Label>
          <Input
            id={`social-${platform}`}
            type="url"
            placeholder="https://"
            value={draft[platform]}
            onChange={e => setDraft(prev => ({
              ...prev,
              [platform]: e.target.value,
            }))}
            onBlur={e => handleBlur(platform, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
