import { Bookmark, MoreVertical, Share } from "@tamagui/lucide-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Toast from "react-native-toast-message";
import { Button, H5, ScrollView, Separator, XStack, YStack } from "tamagui";

import { useArticleDetails } from "@/api/request/feed-management/article";
import { Article } from "@/api/schema/feed-management/article";
import { safeMessage } from "@/api/shared";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { ArticleCategoryPill, ArticleCoverImage } from "@/ui/components/content/article";
import { SourceReferencePill } from "@/ui/components/content/source";
import { BackButton } from "@/ui/components/controls/BackButton";
import { IconButton } from "@/ui/components/controls/IconButton";
import { ScreenView } from "@/ui/components/layout";
import { LoadingView } from "@/ui/components/LoadingView";
import { Caption, Text } from "@/ui/components/typography";

export default function ArticleDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { data, isLoading, error } = useArticleDetails(id as string);
    const article: Article | undefined = data ?? undefined;
    const relativeTime = useRelativeTime(article?.publishedAt);

    const handleReadIntegrality = async () => {
        await WebBrowser.openBrowserAsync(article!.link);
    };

    if (error) {
        Toast.show({
            type: "error",
            text1: "Erreur",
            text2: safeMessage(error),
        });
        router.replace("/(authed)/(tabs)/articles");
    }

    if (isLoading || article === undefined) {
        return <LoadingView />;
    }

    return (
        <ScreenView>
            <ScreenView.Heading
                leadingAction={<BackButton onPress={() => router.dismissTo("/(authed)/(tabs)/articles")} />}
                trailingActions={
                    <>
                        <IconButton onPress={() => {}} icon={<Bookmark size="$1" />} />
                        <IconButton onPress={() => {}} icon={<Share size="$1" />} />
                        <IconButton onPress={() => {}} icon={<MoreVertical size="$1" />} />
                    </>
                }
            />
            <ScrollView>
                <YStack>
                    {article.metadata?.image && (
                        <ArticleCoverImage uri={article.metadata.image} width="100%" height={225} marginBottom="$4" />
                    )}
                </YStack>
                <YStack gap="$4" backgroundColor="$background">
                    <XStack gap="$2" flexWrap="wrap">
                        {article.categories.map((category, index) => (
                            <ArticleCategoryPill key={index} category={category.toLowerCase()} />
                        ))}
                    </XStack>
                    <H5 fontWeight="bold" marginBottom="$1">
                        {article.title}
                    </H5>

                    <YStack gap="$2">
                        <SourceReferencePill data={article.source} />
                        <XStack height={20} alignItems="center">
                            <Caption>{relativeTime}</Caption>
                            <Separator alignSelf="stretch" vertical marginHorizontal={16} />
                            <Caption>{article.readingTime} minutes de lecture</Caption>
                        </XStack>
                    </YStack>

                    <Text size="$3" marginTop="$2">
                        {article.body.trim()}
                    </Text>
                </YStack>
                <Button width="100%" onPress={handleReadIntegrality} theme="accent" fontWeight="bold">
                    Consulter l&#39;article
                </Button>
            </ScrollView>
        </ScreenView>
    );
}
