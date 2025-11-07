import { ChevronRight, Settings } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Label, ListItem, ScrollView, Separator, YGroup } from "tamagui";

import { ScreenView } from "@/ui/components/layout";

export default function Index() {
    const router = useRouter();

    return (
        <ScreenView>
            <ScreenView.Heading title="Profile" />

            <ScrollView width="100%">
                <Label>Settings</Label>
                <YGroup alignSelf="center" bordered size="$4">
                    <YGroup.Item>
                        <ListItem
                            onPress={() => router.push("/account/settings")}
                            icon={Settings}
                            iconAfter={ChevronRight}
                            title="Settings"
                        />
                    </YGroup.Item>
                    <Separator />
                </YGroup>
            </ScrollView>
        </ScreenView>
    );
}
