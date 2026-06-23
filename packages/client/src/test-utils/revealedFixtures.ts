import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { Category, CustomProperty, Website, WebsiteLookup } from "@eesimple/types";

import { sampleCategories, sampleProperties } from "./story-mocks";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

/**
 * A stand-in for the `useWebsiteLookup` mutation result. The `Revealed*` components only read
 * `.data`, so the rest of the mutation surface is faked just enough to satisfy the type.
 */
export function makeWebsiteLookup(data: WebsiteLookup | undefined = undefined): WebsiteLookupResult {
  return {
    data,
    isPending: false,
    isError: false,
    isSuccess: data !== undefined,
    error: null,
    mutate: () => undefined,
    mutateAsync: async () => data as WebsiteLookup,
    reset: () => undefined,
  } as unknown as WebsiteLookupResult;
}

/**
 * The complete bag of props shared by the `Revealed*` sub-components (everything except `form`).
 * Each component picks the slice it needs, so a single bag can be spread into any of them in
 * stories and tests; override only the fields a case cares about.
 */
export function makeRevealedProps(overrides: Partial<RevealedFixtureProps> = {}): RevealedFixtureProps {
  return {
    // Website / YouTube banner.
    websiteLookup: makeWebsiteLookup(),
    youtubeChannel: null,
    onChannelSelfIdsChange: () => undefined,
    websiteSiteName: "",
    onSiteNameChange: () => undefined,
    onSiteNameBlur: () => undefined,

    // Name field + title fetch + feedback.
    onTitleBlur: () => undefined,
    onTitleChange: () => undefined,
    onFetchTitleClick: () => undefined,
    isFetchTitlePending: false,
    isFetchMetadataPending: false,
    titleFetch: null,
    onUndoTitleFetch: () => undefined,
    fetchTitleIsSuccess: false,
    fetchTitleIsError: false,
    fetchTitleErrorMessage: undefined,
    fetchedTitle: undefined,
    isReportingTitle: false,
    onStartReporting: () => undefined,
    expectedTitle: "",
    onExpectedTitleChange: () => undefined,
    onCancelReporting: () => undefined,

    // Autofill offer.
    lockedCategoryId: undefined,
    categories: sampleCategories,
    autofillOfferDismissed: false,
    onAutofillOfferDismiss: () => undefined,

    // URL cleanup panel.
    showUrlCleanup: false,
    cleanupId: "cleanup-1",
    urlCleanupMode: "none",
    onUrlCleanupModeChange: () => undefined,
    websites: [],
    ignoreList: [],

    // Custom fields.
    customProperties: sampleProperties as CustomProperty[],
    numberInputs: {},
    booleanInputs: {},
    dateTimeInputs: {},
    choicesInputs: {},
    onNumberChange: () => undefined,
    onBooleanChange: () => undefined,
    onDateTimeChange: () => undefined,
    onChoicesChange: () => undefined,

    ...overrides,
  };
}

export interface RevealedFixtureProps {
  websiteLookup: WebsiteLookupResult;
  youtubeChannel: null;
  onChannelSelfIdsChange: (ids: string[]) => void;
  websiteSiteName: string;
  onSiteNameChange: (name: string) => void;
  onSiteNameBlur: () => void;
  onTitleBlur: () => void;
  onTitleChange: () => void;
  onFetchTitleClick: (url: string) => void;
  isFetchTitlePending: boolean;
  isFetchMetadataPending: boolean;
  titleFetch: { previous: string } | null;
  onUndoTitleFetch: () => void;
  fetchTitleIsSuccess: boolean;
  fetchTitleIsError: boolean;
  fetchTitleErrorMessage: string | undefined;
  fetchedTitle: string | undefined;
  isReportingTitle: boolean;
  onStartReporting: () => void;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancelReporting: () => void;
  lockedCategoryId?: string;
  categories: Category[];
  autofillOfferDismissed: boolean;
  onAutofillOfferDismiss: () => void;
  showUrlCleanup: boolean;
  cleanupId: string;
  urlCleanupMode: "none" | "trackers" | "all";
  onUrlCleanupModeChange: (mode: "none" | "trackers" | "all") => void;
  websites: Website[];
  ignoreList: string[];
  customProperties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onChoicesChange: (id: string, values: string[]) => void;
}
