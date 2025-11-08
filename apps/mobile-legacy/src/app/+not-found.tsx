import { Link, Stack } from "expo-router";
import { View, YStack } from "tamagui";

import { AppIcon } from "@/ui/components/AppIcon";
import { ScreenView } from "@/ui/components/layout";
import { Heading, Text } from "@/ui/components/typography";

export default function NotFoundScreen() {
  return (
    <ScreenView>
      <Stack.Screen options={{ title: "Oops !" }} />
      <View backgroundColor="$background" flex={1} padding="$4">
        <YStack alignItems="center" flex={1} gap="$4" justifyContent="center">
          <AppIcon height={100} width={100} />
          <YStack alignItems="center" gap="$6" paddingHorizontal="$4" width="100%">
            <YStack>
              <Heading fontWeight="bold" lineHeight="$8" textAlign="center">
                Une erreur s&#39;est produite
              </Heading>
              <Text lineHeight="$1" marginTop="auto" textAlign="center">
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
