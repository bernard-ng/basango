import type React from "react";

import { H2, ParagraphProps } from "tamagui";

export const Display = (props: React.PropsWithChildren<ParagraphProps>) => {
    const { children, ...rest } = props;

    return (
        <H2 fontWeight="bold" lineHeight="$8" {...rest}>
            {children}
        </H2>
    );
};
