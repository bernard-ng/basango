import React from "react";

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
                tabBarShowLabel: true,
                tabBarActiveTintColor: "$accent5",
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: colorScheme === "dark" ? "black" : "white",
                    borderTopWidth: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                    textTransform: "none",
                },
            }}
        >
            <Tabs.Screen
                name="articles"
                options={{
                    href: "/(authed)/(tabs)/articles",
                    tabBarLabel: ({ color }) => (
                        <Paragraph size="$2" color={color}>
                            Actualités
                        </Paragraph>
                    ),
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="sources"
                options={{
                    href: "/(authed)/(tabs)/sources",
                    tabBarLabel: ({ color }) => (
                        <Paragraph size="$2" color={color}>
                            Sources
                        </Paragraph>
                    ),
                    tabBarIcon: ({ color, size }) => <Globe size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookmarks"
                options={{
                    href: "/(authed)/(tabs)/bookmarks",
                    tabBarLabel: ({ color }) => (
                        <Paragraph size="$2" color={color}>
                            Signets
                        </Paragraph>
                    ),
                    tabBarIcon: ({ color, size }) => <BookMarked size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    href: "/(authed)/(tabs)/account",
                    tabBarLabel: ({ color }) => (
                        <Paragraph size="$2" color={color}>
                            Profil
                        </Paragraph>
                    ),
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
