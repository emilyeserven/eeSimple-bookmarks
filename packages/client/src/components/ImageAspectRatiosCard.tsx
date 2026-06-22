import { useEffect, useState } from "react";

import { Trash2 } from "lucide-react";

import {
  useCroppedHeight,
  useCroppedWidth,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useCreateCustomAspectRatio, useCustomAspectRatios, useDeleteCustomAspectRatio } from "../hooks/useCustomAspectRatios";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  RowCard,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/**
 * Settings card for image aspect ratios: edits the built-in "Cropped" ratio (width:height,
 * server-persisted in `app_settings`) and manages the list of custom named ratios shown in the
 * aspect picker. The Cropped W/H save on blur (one request + recorded toast per commit, not per
 * keystroke).
 */
export function ImageAspectRatiosCard() {
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const {
    data: customRatios = [], isLoading, error,
  } = useCustomAspectRatios();
  const deleteMutation = useDeleteCustomAspectRatio();
  const createMutation = useCreateCustomAspectRatio();

  // Local mirrors of the Cropped W/H inputs so typing stays smooth; persisted on blur.
  const [widthInput, setWidthInput] = useState(String(croppedWidth));
  const [heightInput, setHeightInput] = useState(String(croppedHeight));
  useEffect(() => {
    setWidthInput(String(croppedWidth));
  }, [croppedWidth]);
  useEffect(() => {
    setHeightInput(String(croppedHeight));
  }, [croppedHeight]);

  const [newName, setNewName] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newHeight, setNewHeight] = useState("");

  /** Persist a Cropped-ratio change, merging the whole display group, and fire the named toast. */
  function saveCropped(patch: { croppedWidth: number } | { croppedHeight: number }): void {
    if (!displayData) return;
    updateDisplay.mutate({
      ...displayData,
      ...patch,
    }, {
      onSuccess: () => notifySuccess("Cropped ratio updated"),
      onError: error => notifyError(error.message),
    });
  }

  function commitWidth() {
    const w = Math.max(1, Math.round(Number(widthInput) || 1));
    setWidthInput(String(w));
    if (w !== croppedWidth) saveCropped({
      croppedWidth: w,
    });
  }

  function commitHeight() {
    const h = Math.max(1, Math.round(Number(heightInput) || 1));
    setHeightInput(String(h));
    if (h !== croppedHeight) saveCropped({
      croppedHeight: h,
    });
  }

  function handleAdd() {
    const w = parseInt(newWidth, 10);
    const h = parseInt(newHeight, 10);
    if (!newName.trim() || !w || !h) return;
    createMutation.mutate(
      {
        name: newName.trim(),
        width: w,
        height: h,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewWidth("");
          setNewHeight("");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image aspect ratios</CardTitle>
        <CardDescription>
          Configure the built-in &ldquo;Cropped&rdquo; ratio and add custom named ratios to the
          aspect picker.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Cropped ratio</p>
          <p className="text-xs text-muted-foreground">
            The ratio used when the &ldquo;Cropped&rdquo; mode is selected.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={widthInput}
              onChange={e => setWidthInput(e.target.value)}
              onBlur={commitWidth}
              className="w-20"
              aria-label="Cropped width"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={1}
              value={heightInput}
              onChange={e => setHeightInput(e.target.value)}
              onBlur={commitHeight}
              className="w-20"
              aria-label="Cropped height"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Custom ratios</p>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          {!isLoading && customRatios.length > 0
            ? (
              <div className="space-y-2">
                {customRatios.map(ratio => (
                  <RowCard
                    key={ratio.id}
                    className="flex items-center justify-between gap-4 p-3"
                  >
                    <span className="text-sm">
                      {ratio.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({ratio.width}:{ratio.height})
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="
                        size-7 shrink-0 text-muted-foreground
                        hover:text-destructive
                      "
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(ratio.id)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete {ratio.name}</span>
                    </Button>
                  </RowCard>
                ))}
              </div>
            )
            : null}
          {!isLoading && customRatios.length === 0
            ? <p className="text-sm text-muted-foreground">No custom ratios yet.</p>
            : null}

          <div className="flex flex-wrap items-end gap-2 pt-1">
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-name"
                className="text-xs"
              >
                Name
              </Label>
              <Input
                id="new-ratio-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Widescreen"
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-width"
                className="text-xs"
              >
                Width
              </Label>
              <Input
                id="new-ratio-width"
                type="number"
                min={1}
                value={newWidth}
                onChange={e => setNewWidth(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="new-ratio-height"
                className="text-xs"
              >
                Height
              </Label>
              <Input
                id="new-ratio-height"
                type="number"
                min={1}
                value={newHeight}
                onChange={e => setNewHeight(e.target.value)}
                className="w-20"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!newName.trim() || !newWidth || !newHeight || createMutation.isPending}
              onClick={handleAdd}
            >
              {createMutation.isPending ? "Adding…" : "Add ratio"}
            </Button>
          </div>
          {createMutation.isError
            ? <p className="text-sm text-destructive">{createMutation.error?.message}</p>
            : null}
        </div>
      </CardContent>
    </Card>
  );
}
