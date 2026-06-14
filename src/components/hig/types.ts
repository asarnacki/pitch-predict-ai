export type ButtonVariant = "prominent" | "standard" | "plain" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type IconPosition = "leading" | "trailing";

export type HIGTypographyVariant =
  | "largeTitle"
  | "title1"
  | "title2"
  | "title3"
  | "headline"
  | "subheadline"
  | "callout"
  | "body"
  | "footnote"
  | "caption1"
  | "caption2";

export type HIGTone = "primary" | "secondary" | "tertiary";

export type Padding = "none" | "normal" | "compact";

export type ViewWidth = "compact" | "comfortable" | "expanded";

export interface HIGModalAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export interface HIGTabBarItem {
  label: string;
  key: string;
}
