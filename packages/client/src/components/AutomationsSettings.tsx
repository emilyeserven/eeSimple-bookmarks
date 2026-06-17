import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Automation preferences — currently a toggle for auto-fetching bookmark titles. */
export function AutomationsSettings() {
  const autoFetchTitle = useUiStore(state => state.autoFetchTitle);
  const setAutoFetchTitle = useUiStore(state => state.setAutoFetchTitle);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-fetch title</CardTitle>
        <CardDescription>
          When enabled, leaving the URL field while adding a bookmark fetches the page’s title
          automatically. You can always fetch it manually with the button next to the Name field.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-fetch-title"
            checked={autoFetchTitle}
            onCheckedChange={checked => setAutoFetchTitle(checked === true)}
          />
          <Label htmlFor="auto-fetch-title">Fetch the title when the URL field loses focus</Label>
        </div>
      </CardContent>
    </Card>
  );
}
