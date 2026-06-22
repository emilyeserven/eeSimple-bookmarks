/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Clapperboard } from "lucide-react";

import { WithPanelItem } from "./status";
import { useDeleteMediaType, useMediaTypes } from "../../../hooks/useMediaTypes";
import { MediaTypeCard } from "../../MediaTypeCard";
import { MediaTypeGeneralForm } from "../../MediaTypeGeneralForm";
import { PanelEntityEditor } from "../PanelEntityEditor";
import { usePanelDismissAfterDelete } from "../usePanelDismissAfterDelete";

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
  const query = useMediaTypes();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Media type not found."
    >
      {mediaType => <MediaTypeCard mediaType={mediaType} />}
    </WithPanelItem>
  );
}

/** Media-type editor, reusing the same auto-save `MediaTypeGeneralForm` the edit tab renders. */
function MediaTypeEdit({
  id,
}: {
  id: string;
}) {
  const query = useMediaTypes();
  const deleteMediaType = useDeleteMediaType();
  const dismiss = usePanelDismissAfterDelete();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Media type not found."
    >
      {mediaType => (
        <PanelEntityEditor
          name={mediaType.name}
          builtIn={mediaType.builtIn}
          onDelete={mediaType.builtIn
            ? undefined
            : () => deleteMediaType.mutate(mediaType.id, {
              onSuccess: dismiss,
            })}
          deleteIsPending={deleteMediaType.isPending}
          deleteError={deleteMediaType.isError ? deleteMediaType.error.message : null}
        >
          <MediaTypeGeneralForm mediaType={mediaType} />
        </PanelEntityEditor>
      )}
    </WithPanelItem>
  );
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
