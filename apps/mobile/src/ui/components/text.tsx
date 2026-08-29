import type { ParagraphProps } from "tamagui";
import { H2, H4, Paragraph } from "tamagui";

export type TextProps = ParagraphProps & {
  variant?: "body" | "caption" | "display" | "heading" | "label" | "title";
};

export function Text({ variant = "body", ...props }: TextProps) {
  switch (variant) {
    case "caption":
      return <Paragraph color="$mutedColor" fontSize="$2" lineHeight="$1" {...props} />;
    case "display":
      return <H2 fontWeight="bold" lineHeight="$8" {...props} />;
    case "heading":
      return <H4 alignSelf="flex-start" fontWeight="bold" {...props} />;
    case "label":
      return <Paragraph fontWeight="600" {...props} />;
    case "title":
      return <Paragraph fontSize="$5" fontWeight="600" {...props} />;
    default:
      return <Paragraph {...props} />;
  }
}
