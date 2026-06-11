export type Language = "pl" | "en";

// No manual Translation type — infer it from the base locale JSON.
// This gives type-safety without having to maintain interfaces.
export type Translation = typeof import("./locales/pl.json");
