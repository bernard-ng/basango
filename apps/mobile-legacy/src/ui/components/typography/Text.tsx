import type React from "react";

import { Paragraph, ParagraphProps } from "tamagui";

export const Text = (props: React.PropsWithChildren<ParagraphProps>) => {
    const { children, ...rest } = props;
    return <Paragraph {...rest}>{children}</Paragraph>;
};
