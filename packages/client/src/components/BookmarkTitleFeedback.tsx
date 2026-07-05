import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="expected-title">{t("Expected title")}</Label>
      <Input
        id="expected-title"
        value={expectedTitle}
        onChange={e => onExpectedTitleChange(e.target.value)}
        placeholder={t("Enter the correct title")}
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
              t("**URL:** {{url}}", {
                url: getFormUrl(),
              }),
              t("**Actual title parsed:** {{title}}", {
                title: fetchedTitle ?? getFormTitle(),
              }),
              t("**Expected title:** {{title}}", {
                title: expectedTitle,
              }),
            ].join("\n\n");
            openGitHubIssue(t("Incorrect page title parsed"), body);
          }}
        >
          {t("Open GitHub issue")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          {t("Cancel")}
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
  const {
    t,
  } = useTranslation();
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {!isReportingTitle
          ? (
            <p>
              {t("Incorrect title?")}
              {" "}
              <button
                type="button"
                className="
                  underline
                  hover:text-foreground
                "
                onClick={onStartReporting}
              >
                {t("Report it")}
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
          {errorMessage ?? t("Could not fetch a title for that URL.")}
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const body = [
                t("**URL:** {{url}}", {
                  url: getFormUrl(),
                }),
                t("**Error:** {{error}}", {
                  error: errorMessage ?? t("Unknown error"),
                }),
              ].join("\n\n");
              openGitHubIssue(t("Title fetch failed"), body);
            }}
          >
            {t("File GitHub issue")}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
