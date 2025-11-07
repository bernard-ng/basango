import { useLocalSearchParams } from "expo-router";

import { ScreenView } from "@/ui/components/layout";
import { Heading, Text } from "@/ui/components/typography";

export default function SourceDetails() {
    const { name } = useLocalSearchParams();

    return (
        <ScreenView>
            <Heading>Source Details</Heading>
            <Text>{name}</Text>
        </ScreenView>
    );
}
