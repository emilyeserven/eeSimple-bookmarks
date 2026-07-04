// This module pairs reusable field/form components with the TanStack `useAppForm`
// hook they're wired into, so it intentionally exports a hook alongside components.
/* eslint-disable react-refresh/only-export-components */
import type { ComboboxOption } from "@/components/Combobox";
import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { ReactNode } from "react";

import { useId } from "react";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import { Combobox } from "@/components/Combobox";
import { TreeCombobox } from "@/components/TreeCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputAddon, InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const {
  fieldContext, formContext, useFieldContext, useFormContext,
}
  = createFormHookContexts();

/** Normalise a field's errors (string | { message } | …) into displayable strings. */
export function fieldErrorMessages(errors: unknown[]): string[] {
  return errors
    .map(error => (typeof error === "string" ? error : (error as { message?: string })?.message))
    .filter((message): message is string => Boolean(message));
}

/** Destructive helper text rendered beneath a field's control. */
function FieldErrors({
  errors,
}: {
  errors: unknown[];
}) {
  const {
    t,
  } = useTranslation();
  const messages = fieldErrorMessages(errors);
  if (messages.length === 0) return null;
  return <span className="block text-xs text-destructive">{messages.map(m => t(m)).join(", ")}</span>;
}

interface TextFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Class for the wrapping element. */
  className?: string;
  /** Class applied to the input itself (e.g. compact inline sizing). */
  inputClassName?: string;
  /** Visually hide the label but keep it as the input's accessible name. */
  hideLabel?: boolean;
  /** Extra blur handler (runs after the field's own blur), e.g. submit-on-blur. */
  onBlur?: () => void;
  /** Optional control rendered at the inline-end of the input (input-group pattern). */
  action?: ReactNode;
}

/** Labelled text input bound to the surrounding field. */
function TextField({
  label, type = "text", placeholder, disabled, className, inputClassName, hideLabel, onBlur, action,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const input = (
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className={action ? `pe-10 ${inputClassName ?? ""}`.trim() : inputClassName}
      value={field.state.value}
      onBlur={() => {
        field.handleBlur();
        onBlur?.();
      }}
      onChange={event => field.handleChange(event.target.value)}
    />
  );

  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <Label
        htmlFor={id}
        className={hideLabel ? "sr-only" : undefined}
      >
        {label}
      </Label>
      {action
        ? (
          <InputGroup>
            {input}
            <InputAddon align="inline-end">{action}</InputAddon>
          </InputGroup>
        )
        : input}
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Class applied to the textarea itself (e.g. a tighter min-height to start at one row). */
  inputClassName?: string;
  /** Extra blur handler (runs after the field's own blur), e.g. autofill-on-blur. */
  onBlur?: () => void;
  /** Extra change handler (runs after the field's own change), e.g. clearing an undo banner. */
  onChange?: () => void;
  /** Optional control rendered at the inline-end of the textarea (input-group pattern). */
  action?: ReactNode;
  /** Stretch the textarea to fill its container's height (for equal-height grid cells). */
  fill?: boolean;
}

/** Labelled multi-line text input bound to the surrounding field. */
function TextareaField({
  label, placeholder, rows = 2, disabled, inputClassName, onBlur, onChange, action, fill,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const textarea = (
    <Textarea
      id={id}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`${fill ? "h-full flex-1" : ""} ${action ? "pe-10" : ""} ${inputClassName ?? ""}`.trim() || undefined}
      value={field.state.value}
      onBlur={() => {
        field.handleBlur();
        onBlur?.();
      }}
      onChange={(event) => {
        field.handleChange(event.target.value);
        onChange?.();
      }}
    />
  );

  return (
    <div className={fill ? "flex h-full flex-col gap-1" : "space-y-1"}>
      <Label htmlFor={id}>{label}</Label>
      {action
        ? (
          <InputGroup>
            {textarea}
            <InputAddon
              align="inline-end"
              className="items-start pt-1"
            >
              {action}
            </InputAddon>
          </InputGroup>
        )
        : textarea}
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface RichTextFieldProps {
  label: string;
  /** Guidance shown beneath the label (the editor has no in-canvas placeholder). */
  hint?: string;
}

/**
 * Labelled rich-text editor bound to the surrounding field, emitting **HTML**. Used where pasted
 * rich text must keep its `<a href>` anchors (the newsletter import paste source). Built on the
 * shared `RichTextEditor` primitive in HTML output mode.
 */
function RichTextField({
  label, hint,
}: RichTextFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <RichTextEditor
        output="html"
        value={field.state.value}
        onChange={value => field.handleChange(value)}
        onBlur={() => field.handleBlur()}
      />
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
  /** Extra blur handler (runs after the field's own blur), e.g. auto-save-on-blur. */
  onBlur?: () => void;
  /** Optional control rendered at the inline-end of the input (input-group pattern). */
  action?: ReactNode;
}

/** Labelled numeric input; empty input maps to 0 to keep the value a number. */
function NumberField({
  label, placeholder, disabled, className, hint, onBlur, action,
}: NumberFieldProps) {
  const field = useFieldContext<number>();
  const id = useId();

  const input = (
    <Input
      id={id}
      type="number"
      placeholder={placeholder}
      disabled={disabled}
      className={action ? `pe-10 ${className ?? ""}`.trim() : className}
      value={Number.isNaN(field.state.value) ? "" : field.state.value}
      onBlur={() => {
        field.handleBlur();
        onBlur?.();
      }}
      onChange={(event) => {
        const next = event.target.valueAsNumber;
        field.handleChange(Number.isNaN(next) ? 0 : next);
      }}
    />
  );

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {action
        ? (
          <InputGroup>
            {input}
            <InputAddon align="inline-end">{action}</InputAddon>
          </InputGroup>
        )
        : input}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
  className?: string;
  /** Render the select read-only (e.g. an immutable field shown for context). */
  disabled?: boolean;
  /** Extra change handler (runs after the field's own change), e.g. auto-save-on-change. */
  onValueChange?: (value: string) => void;
}

/** Labelled single-select bound to the surrounding field. */
function SelectField({
  label, options, placeholder, className, disabled, onValueChange,
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={field.state.value || undefined}
        disabled={disabled}
        onValueChange={(value) => {
          field.handleChange(value);
          field.handleBlur();
          onValueChange?.(value);
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface ComboboxFieldProps {
  label: string;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  /** Optional action pinned to the bottom of the dropdown (e.g. inline "Create…"). */
  createOption?: {
    label: string;
    onSelect: () => void;
  };
  /** Extra change handler (runs after the field's own change), e.g. auto-save-on-change. */
  onValueChange?: (value: string) => void;
}

/**
 * Labelled searchable single-select (type-to-filter) bound to the surrounding field.
 * Like `SelectField` but built on `Combobox`, and options may carry a left-aligned `icon`.
 */
function ComboboxField({
  label, options, placeholder, searchPlaceholder, emptyText, className, createOption, onValueChange,
}: ComboboxFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        id={id}
        aria-label={label}
        options={options}
        value={field.state.value || undefined}
        onValueChange={(value) => {
          field.handleChange(value ?? "");
          field.handleBlur();
          onValueChange?.(value ?? "");
        }}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        createOption={createOption}
      />
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface TreeComboboxFieldProps {
  label: string;
  options: TreeComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  /** Optional action pinned to the bottom of the dropdown (e.g. inline "Create…"). */
  createOption?: {
    label: string;
    onSelect: () => void;
  };
  /** Optional non-tree row pinned above the tree that survives search (e.g. tags' "(root)"). */
  leadingOption?: {
    value: string;
    label: string;
  };
  /** Extra change handler (runs after the field's own change), e.g. auto-save-on-change. */
  onValueChange?: (value: string) => void;
}

/**
 * Labelled searchable single-select bound to the surrounding field, like `ComboboxField` but built
 * on `TreeCombobox` so a hierarchical taxonomy (media types) renders as a collapsible tree with
 * hierarchy-preserving search.
 */
function TreeComboboxField({
  label, options, placeholder, searchPlaceholder, emptyText, className, createOption, leadingOption,
  onValueChange,
}: TreeComboboxFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <Label htmlFor={id}>{label}</Label>
      <TreeCombobox
        id={id}
        aria-label={label}
        options={options}
        value={field.state.value || undefined}
        onValueChange={(value) => {
          field.handleChange(value ?? "");
          field.handleBlur();
          onValueChange?.(value ?? "");
        }}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        createOption={createOption}
        leadingOption={leadingOption}
      />
      {field.state.meta.isTouched && <FieldErrors errors={field.state.meta.errors} />}
    </div>
  );
}

interface SubmitButtonProps {
  /** Label shown when idle. */
  label: string;
  /** Label shown while submitting (defaults to `label`). */
  pendingLabel?: string;
  size?: "default" | "sm" | "lg";
  /** Extra condition that disables the button on top of the form's own validity. */
  disabledWhen?: boolean;
  /**
   * Also disable while every field still holds its default value (non-persistent dirty).
   * Replaces the per-form `Subscribe`-to-values + manual dirty comparison on edit forms.
   */
  requireDirty?: boolean;
}

/** Submit button wired to the form's `canSubmit` / `isSubmitting` state. */
function SubmitButton({
  label, pendingLabel, size = "default", disabledWhen = false, requireDirty = false,
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue] as const}
    >
      {([canSubmit, isSubmitting, isDefaultValue]) => (
        <Button
          type="submit"
          size={size}
          disabled={!canSubmit || disabledWhen || (requireDirty && isDefaultValue)}
        >
          {isSubmitting ? (pendingLabel ?? label) : label}
        </Button>
      )}
    </form.Subscribe>
  );
}

export const {
  useAppForm,
  withFieldGroup,
} = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    RichTextField,
    NumberField,
    SelectField,
    ComboboxField,
    TreeComboboxField,
  },
  formComponents: {
    SubmitButton,
  },
});
