import { ArrowRight } from "@tamagui/lucide-icons";
import { Href, Link } from "expo-router";
import { GetProps, Paragraph, XStack, styled } from "tamagui";

import { Text } from "@/ui/components/typography";

const SectionContainer = styled(XStack, {
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: "$2",
  width: "100%",
});

type ScreenSectionProps = GetProps<typeof SectionContainer> & {
  title: string;
  forwardLink?: Href;
};

type ScreenSectionLinkProps = {
  href: Href;
};

const ScreenSectionLink = ({ href }: ScreenSectionLinkProps) => (
  <Link asChild href={href} push>
    <XStack alignItems="center" gap="2">
      <Paragraph color="$accent5" fontWeight={500}>
        Voir tout
      </Paragraph>
      <ArrowRight color="$accent5" />
    </XStack>
  </Link>
);

export const ScreenSection = (props: ScreenSectionProps) => {
  const { title, forwardLink, ...rest } = props;

  return (
    <SectionContainer {...rest}>
      <Text
        color="$color"
        flexShrink={1}
        fontSize="$6"
        fontWeight="bold"
        marginRight="$2"
        numberOfLines={1}
      >
        {title}
      </Text>
      {forwardLink && <ScreenSectionLink href={forwardLink} />}
    </SectionContainer>
  );
};
