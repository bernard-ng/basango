import { MailIcon, ShieldCheckIcon, SunMoonIcon, UserRoundIcon } from "lucide-react-native";
import { ActionSheetIOS, Alert, ScrollView } from "react-native";
import { XStack, YStack } from "tamagui";

import {
  type AppearancePreference,
  appearanceLabels,
  useAppearance,
} from "#mobile/application/appearance";
import { authClient } from "#mobile/application/auth/auth-client";
import { GroupedIcon, GroupedRow, GroupedSection } from "#mobile/ui/components/grouped-list";
import { SourceAvatar } from "#mobile/ui/components/source-avatar";
import { LoadingState } from "#mobile/ui/components/status-state";
import { Text } from "#mobile/ui/components/text";
import { screenBottomPadding, screenGutter, sectionGap } from "#mobile/ui/layout";
import { useAppColors } from "#mobile/ui/theme";

export function AccountScreen() {
  const { preference, resolvedScheme, setPreference } = useAppearance();
  const colors = useAppColors();
  const session = authClient.useSession();
  const user = session.data?.user;

  async function handleSignOut() {
    const result = await authClient.signOut();

    if (result.error) {
      Alert.alert("Déconnexion impossible", result.error.message ?? "Réessayez dans un instant.");
    }
  }

  function confirmSignOut() {
    Alert.alert("Se déconnecter ?", "Vous devrez vous reconnecter pour accéder à votre compte.", [
      { style: "cancel", text: "Annuler" },
      { onPress: () => void handleSignOut(), style: "destructive", text: "Se déconnecter" },
    ]);
  }

  function chooseAppearance() {
    const preferences: AppearancePreference[] = ["system", "light", "dark"];
    const options = preferences.map((option) =>
      option === preference ? `✓ ${appearanceLabels[option]}` : appearanceLabels[option],
    );

    ActionSheetIOS.showActionSheetWithOptions(
      {
        cancelButtonIndex: options.length,
        options: [...options, "Annuler"],
        title: "Apparence",
        userInterfaceStyle: resolvedScheme,
      },
      (selectedIndex) => {
        const selectedPreference = preferences[selectedIndex];

        if (selectedPreference) {
          setPreference(selectedPreference);
        }
      },
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        gap: sectionGap,
        paddingBottom: screenBottomPadding,
        paddingHorizontal: screenGutter,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.groupedBackground, flex: 1 }}
    >
      {!user ? (
        <LoadingState label="Chargement du profil…" />
      ) : (
        <>
          <GroupedSection>
            <XStack alignItems="center" gap="$4" minHeight={88} padding="$4">
              <SourceAvatar name={user.name} size="medium" />
              <YStack flex={1} gap="$0.5">
                <Text fontSize="$6" fontWeight="600" numberOfLines={1}>
                  {user.name}
                </Text>
                <Text numberOfLines={1} variant="caption">
                  {user.email}
                </Text>
              </YStack>
            </XStack>
          </GroupedSection>

          <GroupedSection title="Informations personnelles">
            <GroupedRow
              icon={
                <GroupedIcon>
                  <UserRoundIcon color="white" size={18} strokeWidth={1.9} />
                </GroupedIcon>
              }
              label="Nom"
              showSeparator
              value={user.name}
            />
            <GroupedRow
              icon={
                <GroupedIcon>
                  <MailIcon color="white" size={17} strokeWidth={1.9} />
                </GroupedIcon>
              }
              label="Adresse e-mail"
              showSeparator
              value={user.email}
            />
            <GroupedRow
              icon={
                <GroupedIcon>
                  <ShieldCheckIcon color="white" size={17} strokeWidth={1.9} />
                </GroupedIcon>
              }
              label="Compte"
              value={user.emailVerified ? "E-mail vérifié" : "E-mail non vérifié"}
            />
          </GroupedSection>

          <GroupedSection title="Apparence">
            <GroupedRow
              accessibilityHint="Choisit le thème système, clair ou sombre"
              icon={
                <GroupedIcon>
                  <SunMoonIcon color="white" size={17} strokeWidth={1.9} />
                </GroupedIcon>
              }
              label="Thème"
              onPress={chooseAppearance}
              value={appearanceLabels[preference]}
            />
          </GroupedSection>

          <GroupedSection>
            <GroupedRow
              accessibilityHint="Ferme la session sur cet appareil"
              destructive
              label="Se déconnecter"
              onPress={confirmSignOut}
            />
          </GroupedSection>
          <Text textAlign="center" variant="caption">
            Basango · L’actualité qui vous rapproche
          </Text>
        </>
      )}
    </ScrollView>
  );
}
