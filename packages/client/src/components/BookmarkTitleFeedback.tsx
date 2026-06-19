import { openGitHubIssue } from "./bookmarkFormSchema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IncorrectTitleReporterProps {
  fetchedTitle: string | undefined;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancel: () => void;
  getFormUrl: () => string;
  getFormTitle: () => string;
}

function IncorrectTitleReporter({
  fetchedTitle, expectedTitle, onExpectedTitleChange, onCancel, getFormUrl, getFormTitle,
}: IncorrectTitleReporterProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="expected-title">Expected title</Label>
      <Input
        id="expected-title"
        value={expectedTitle}
        onChange={e => onExpectedTitleChange(e.target.value)}
        placeholder="Enter the correct title"
        className="h-8"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!expectedTitle.trim()}
          onClick={() => {
            const body = [
              `**URL:** ${getFormUrl()}`,
              `**Actual title parsed:** ${fetchedTitle ?? getFormTitle()}`,
              `**Expected title:** ${expectedTitle}`,
            ].join("\n\n");
            openGitHubIssue("Incorrect page title parsed", body);
          }}
        >
          Open GitHub issue
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface TitleFetchFeedbackProps {
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  fetchedTitle: string | undefined;
  isReportingTitle: boolean;
  onStartReporting: () => void;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancelReporting: () => void;
  /** Returns the current URL at click-time (not a reactive value). */
  getFormUrl: () => string;
  /** Returns the current title at click-time (not a reactive value). */
  getFormTitle: () => string;
}

/** Success/error feedback shown below the title field after a fetch-title attempt. */
export function TitleFetchFeedback({
  isSuccess,
  isError,
  errorMessage,
  fetchedTitle,
  isReportingTitle,
  onStartReporting,
  expectedTitle,
  onExpectedTitleChange,
  onCancelReporting,
  getFormUrl,
  getFormTitle,
}: TitleFetchFeedbackProps) {
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {!isReportingTitle
          ? (
            <p>
              Incorrect title?
              {" "}
              <button
                type="button"
                className="
                  underline
                  hover:text-foreground
                "
                onClick={onStartReporting}
              >
                Report it
              </button>
            </p>
          )
          : (
            <IncorrectTitleReporter
              fetchedTitle={fetchedTitle}
              expectedTitle={expectedTitle}
              onExpectedTitleChange={onExpectedTitleChange}
              onCancel={onCancelReporting}
              getFormUrl={getFormUrl}
              getFormTitle={getFormTitle}
            />
          )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-destructive">
          {errorMessage ?? "Could not fetch a title for that URL."}
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const body = [
                `**URL:** ${getFormUrl()}`,
                `**Error:** ${errorMessage ?? "Unknown error"}`,
              ].join("\n\n");
              openGitHubIssue("Title fetch failed", body);
            }}
          >
            File GitHub issue
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
