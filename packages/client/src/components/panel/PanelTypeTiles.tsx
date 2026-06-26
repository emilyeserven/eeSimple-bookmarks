import { Bell, Sparkles } from "lucide-react";

import { PANEL_CONTENT_TYPES } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";

import { Button } from "@/components/ui/button";

/** The panel's landing state: a grid of tiles, one per browsable content type. */
export function PanelTypeTiles() {
  const {
    openType,
  } = usePanelControls();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Browse</h2>
        <p className="text-sm text-muted-foreground">Pick a type to view or edit its items.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PANEL_CONTENT_TYPES.map(({
          type, label, icon: Icon,
        }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4"
            onClick={() => openType(type)}
          >
            <Icon className="size-5" />
            <span className="text-sm font-medium">{label}</span>
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full flex-col items-start gap-2 p-4"
        onClick={() => openType("notifications")}
      >
        <Bell className="size-5" />
        <span className="text-sm font-medium">Notifications</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full flex-col items-start gap-2 p-4"
        onClick={() => openType("ai-summarization")}
      >
        <Sparkles className="size-5" />
        <span className="text-sm font-medium">AI Summarization</span>
      </Button>
    </div>
  );
}
