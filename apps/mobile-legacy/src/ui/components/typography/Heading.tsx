import type React from "react";

import { H4, ParagraphProps } from "tamagui";

export const Heading = (props: React.PropsWithChildren<ParagraphProps>) => {
    const { children, ...rest } = props;

    return (
        <H4 fontWeight="bold" alignSelf="flex-start" {...rest}>
            {children}
        </H4>
    );
};
