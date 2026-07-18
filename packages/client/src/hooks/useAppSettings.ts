// Server-persisted app-settings hooks, one module per settings group under `appSettings/`. Every
// group is a `useX()` query + `useUpdateX()` mutation (plus resolved-value getters) keyed off the
// `app_settings` singleton. This shell re-exports them all so consumers keep importing from
// `./useAppSettings`.
export * from "./appSettings/advanced";
export * from "./appSettings/aiAutotag";
export * from "./appSettings/aiSummarization";
export * from "./appSettings/automation";
export * from "./appSettings/bookmarkAddForm";
export * from "./appSettings/bookmarkGraph";
export * from "./appSettings/connectors";
export * from "./appSettings/databaseUsage";
export * from "./appSettings/displayPreferences";
export * from "./appSettings/homepageContent";
export * from "./appSettings/linkParsing";
export * from "./appSettings/locationDisplay";
export * from "./appSettings/personSourceLabels";
export * from "./appSettings/scratchpad";
export * from "./appSettings/sidebarCustomization";
export * from "./appSettings/tagReparent";
