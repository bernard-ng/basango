import { BookMarked, Globe, Home, User } from "@tamagui/lucide-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Paragraph } from "tamagui";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="articles"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "$accent5",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          textTransform: "none",
        },
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "black" : "white",
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="articles"
        options={{
          href: "/(authed)/(tabs)/articles",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarLabel: ({ color }) => (
            <Paragraph color={color} size="$2">
              Actualités
            </Paragraph>
          ),
        }}
      />
      <Tabs.Screen
        name="sources"
        options={{
          href: "/(authed)/(tabs)/sources",
          tabBarIcon: ({ color, size }) => <Globe color={color} size={size} />,
          tabBarLabel: ({ color }) => (
            <Paragraph color={color} size="$2">
              Sources
            </Paragraph>
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          href: "/(authed)/(tabs)/bookmarks",
          tabBarIcon: ({ color, size }) => <BookMarked color={color} size={size} />,
          tabBarLabel: ({ color }) => (
            <Paragraph color={color} size="$2">
              Signets
            </Paragraph>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: "/(authed)/(tabs)/account",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarLabel: ({ color }) => (
            <Paragraph color={color} size="$2">
              Profil
            </Paragraph>
          ),
        }}
      />
    </Tabs>
  );
}
