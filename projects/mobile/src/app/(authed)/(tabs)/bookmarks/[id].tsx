import { useLocalSearchParams } from "expo-router";
import { Paragraph } from "tamagui";

import { ScreenView } from "@/ui/components/layout";
import { Heading } from "@/ui/components/typography";

export default function Details() {
    const { id } = useLocalSearchParams();
    // const { data, isLoading } = useBookmarkedArticlesList(id as string);
    // const articles: BookmarkedArticle[] = useFlattenedItems(data);

    return (
        <ScreenView>
            <Heading>Bookmark Infos</Heading>
            <Paragraph>{id}</Paragraph>
        </ScreenView>
    );
}
