import { SourcePill } from "./SourcePill";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { RowCard } from "@/components/ui/card";

interface EntityAutofillSourcesProps {
  /** The entity being viewed: a category (matched by `category.id`) or a tag (matched by default tags). */
  match:
    | { kind: "category";
      categoryId: string; }
      | { kind: "tag";
        tagId: string; };
}

/**
 * Surfaces the websites and YouTube channels whose default category / default tags point at the
 * currently-viewed category or tag — i.e. the sources that will autofill it onto new bookmarks.
 * Renders a "Websites" card and/or a "YouTube Channels" card of clickable pills, or nothing when no
 * source feeds this entity.
 */
export function EntityAutofillSources({
  match,
}: EntityAutofillSourcesProps) {
  const {
    data: websites,
  } = useWebsites();
  const {
    data: channels,
  } = useYouTubeChannels();

  const matchedWebsites = (websites ?? []).filter(site =>
    match.kind === "category"
      ? site.category?.id === match.categoryId
      : (site.tagIds ?? []).includes(match.tagId));
  const matchedChannels = (channels ?? []).filter(channel =>
    match.kind === "category"
      ? channel.category?.id === match.categoryId
      : (channel.tagIds ?? []).includes(match.tagId));

  if (matchedWebsites.length === 0 && matchedChannels.length === 0) return null;

  const websiteNote = match.kind === "category"
    ? "Bookmarks saved from these sites are automatically added to this category."
    : "Bookmarks saved from these sites are automatically tagged with this tag.";
  const channelNote = match.kind === "category"
    ? "Bookmarks saved from these channels are automatically added to this category."
    : "Bookmarks saved from these channels are automatically tagged with this tag.";

  return (
    <div className="space-y-3">
      {matchedWebsites.length > 0
        ? (
          <RowCard className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">Websites</h3>
            <p className="text-xs text-muted-foreground">{websiteNote}</p>
            <div className="flex flex-wrap gap-2">
              {matchedWebsites.map(site => (
                <SourcePill
                  key={site.id}
                  type="website"
                  data={site}
                />
              ))}
            </div>
          </RowCard>
        )
        : null}
      {matchedChannels.length > 0
        ? (
          <RowCard className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">YouTube Channels</h3>
            <p className="text-xs text-muted-foreground">{channelNote}</p>
            <div className="flex flex-wrap gap-2">
              {matchedChannels.map(channel => (
                <SourcePill
                  key={channel.id}
                  type="youtube-channel"
                  data={channel}
                />
              ))}
            </div>
          </RowCard>
        )
        : null}
    </div>
  );
}
