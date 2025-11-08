import type React from "react";

import { Paragraph, ParagraphProps } from "tamagui";

export const Caption = (props: React.PropsWithChildren<ParagraphProps>) => {
  const { children, ...rest } = props;

  return (
    <Paragraph color="$gray10" fontSize="$2" lineHeight="$1" {...rest}>
      {children}
    </Paragraph>
  );
};
