import type React from "react";

import { Paragraph, ParagraphProps } from "tamagui";

export const Caption = (props: React.PropsWithChildren<ParagraphProps>) => {
    const { children, ...rest } = props;

    return (
        <Paragraph fontSize="$2" lineHeight="$1" color="$gray10" {...rest}>
            {children}
        </Paragraph>
    );
};
