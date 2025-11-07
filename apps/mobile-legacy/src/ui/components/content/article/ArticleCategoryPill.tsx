import React from "react";

import { Caption } from "@/ui/components/typography";

type ArticleCategoryPillProps = {
    category: string;
};

export const ArticleCategoryPill = (props: ArticleCategoryPillProps) => {
    const { category } = props;

    return <Caption>{category}</Caption>;
};
