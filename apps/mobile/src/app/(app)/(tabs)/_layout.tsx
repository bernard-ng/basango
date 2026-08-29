import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from "react-native";

const accentColor = DynamicColorIOS({
  dark: "#0a84ff",
  light: "#007aff",
});

export default function TabLayout() {
  return (
    <NativeTabs tintColor={accentColor}>
      <NativeTabs.Trigger name="articles">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
        <NativeTabs.Trigger.Label>Actualités</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sources">
        <NativeTabs.Trigger.Icon sf="antenna.radiowaves.left.and.right" />
        <NativeTabs.Trigger.Label>Sources</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookmarks">
        <NativeTabs.Trigger.Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
        <NativeTabs.Trigger.Label>Signets</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
