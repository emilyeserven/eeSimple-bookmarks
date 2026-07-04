import { useRef, useState } from "react";

import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ACCEPTED = /\.(?:eml|html?|txt)$/i;

interface NewsletterFileFieldProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

/** Drag-and-drop / picker for a saved newsletter file (.eml / .html / .txt). Mirrors BookmarkImageField. */
export function NewsletterFileField({
  file, onChange,
}: NewsletterFileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    t,
  } = useTranslation();

  function handleFile(next: File | null) {
    if (!next) return;
    if (!ACCEPTED.test(next.name)) {
      setError(t("Unsupported file — choose an .eml, .html, or .txt file."));
      return;
    }
    setError(null);
    onChange(next);
  }

  return (
    <div className="space-y-1">
      <Label>{t("Newsletter file")}</Label>
      {file
        ? (
          <div
            className="
              flex items-center justify-between rounded-md border px-3 py-2
              text-sm
            "
          >
            <span className="min-w-0 truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(null)}
              aria-label={t("Remove file")}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : (
          <div
            className="
              rounded-md border border-dashed p-6 text-center text-sm
              text-muted-foreground transition-colors
              hover:bg-accent
            "
            onDragOver={event => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files[0] ?? null);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".eml,.html,.htm,.txt"
              onChange={event => handleFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />
              {t("Choose a file or drag it here")}
            </Button>
          </div>
        )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
