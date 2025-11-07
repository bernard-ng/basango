import { Link, Stack } from "expo-router";
import { View, YStack } from "tamagui";

import { AppIcon } from "@/ui/components/AppIcon";
import { ScreenView } from "@/ui/components/layout";
import { Heading, Text } from "@/ui/components/typography";

export default function NotFoundScreen() {
    return (
        <ScreenView>
            <Stack.Screen options={{ title: "Oops !" }} />
            <View flex={1} backgroundColor="$background" padding="$4">
                <YStack alignItems="center" justifyContent="center" flex={1} gap="$4">
                    <AppIcon width={100} height={100} />
                    <YStack width="100%" gap="$6" alignItems="center" paddingHorizontal="$4">
                        <YStack>
                            <Heading fontWeight="bold" lineHeight="$8" textAlign="center">
                                Une erreur s&#39;est produite
                            </Heading>
                            <Text textAlign="center" lineHeight="$1" marginTop="auto">
                                Nous avons une difficulté à charger la page que vous recherchez.
                            </Text>
                        </YStack>

                        <Link href="/(unauthed)/welcome">
                            <Text>Recommencer</Text>
                        </Link>
                    </YStack>
                </YStack>
            </View>
        </ScreenView>
    );
}
