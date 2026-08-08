/**
 * AI Prompt Builder settings: the reusable preamble prepended to the generated "ask an AI about
 * these bookmarks" prompt on the AI Prompt Builder action page. The read-only sibling of
 * `AiBulkEditSettings` — the builder never parses a reply back, so there is nothing else to store.
 */
export interface AiPromptBuilderSettings {
  /** The stored preamble; empty falls back to the client's built-in default instructions. */
  aiPromptBuilderPrompt: string;
}

/** Payload for replacing the AI Prompt Builder settings. */
export type UpdateAiPromptBuilderInput = AiPromptBuilderSettings;
