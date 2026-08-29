import { RssIcon } from "lucide-react-native";
import { YStack } from "tamagui";

type LogoMarkProps = {
  size?: "large" | "small";
};

export function LogoMark({ size = "large" }: LogoMarkProps) {
  const isLarge = size === "large";
  const dimension = isLarge ? 120 : 40;

  return (
    <YStack
      alignItems="center"
      backgroundColor="#2581c4"
      borderRadius={isLarge ? "$8" : "$3"}
      height={dimension}
      justifyContent="center"
      overflow="hidden"
      width={dimension}
    >
      <YStack
        backgroundColor="#d94b55"
        bottom={0}
        height="29%"
        left={0}
        position="absolute"
        right={0}
      />
      <YStack
        backgroundColor="#facc15"
        bottom="28%"
        height={isLarge ? 5 : 2}
        left={0}
        position="absolute"
        right={0}
      />
      <RssIcon color="#facc15" size={isLarge ? 58 : 23} strokeWidth={2.5} />
    </YStack>
  );
}
