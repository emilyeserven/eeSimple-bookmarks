/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Clapperboard } from "lucide-react";

import { Loading, Problem } from "./status";
import { useMediaTypes } from "../../../hooks/useMediaTypes";
import { MediaTypeCard } from "../../MediaTypeCard";
import { MediaTypeRow } from "../../MediaTypeRow";

function useMediaTypeList() {
  const {
    data, isLoading, error,
  } = useMediaTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(mediaType => ({
      id: mediaType.id,
      label: mediaType.name,
      sublabel: mediaType.builtIn ? "Built-in" : "Custom",
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only media-type view, reusing the same `MediaTypeCard` the view page renders. */
function MediaTypeView({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useMediaTypes();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const mediaType = (data ?? []).find(item => item.id === id);
  if (!mediaType) return <Problem>Media type not found.</Problem>;
  return <MediaTypeCard mediaType={mediaType} />;
}

/** Inline media-type editor, reusing the same `MediaTypeRow` the settings and edit pages use. */
function MediaTypeEdit({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useMediaTypes();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const mediaType = (data ?? []).find(item => item.id === id);
  if (!mediaType) return <Problem>Media type not found.</Problem>;
  return <MediaTypeRow mediaType={mediaType} />;
}

export const mediaTypeContentType: PanelContentTypeDef = {
  type: "media-type",
  label: "Media Types",
  singular: "Media Type",
  icon: Clapperboard,
  useList: useMediaTypeList,
  View: MediaTypeView,
  Edit: MediaTypeEdit,
};
