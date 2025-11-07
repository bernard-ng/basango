import type React from "react";

import { GetProps, Image, styled } from "tamagui";

const StyledImage = styled(Image, {
    borderRadius: "$12",
    backgroundColor: "white",
});

type SourceAvatarProps = GetProps<typeof StyledImage> & {
    image: string;
    name: string;
    size?: number;
};

export const SourceProfileImage = (props: SourceAvatarProps) => {
    const { image, name, size = 50, ...rest } = props;

    return (
        <StyledImage
            accessibilityLabel={name}
            source={{
                uri: image,
                cache: "force-cache",
            }}
            objectFit="contain"
            width={size}
            height={size}
            {...rest}
        />
    );
};
