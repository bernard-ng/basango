import { useState } from "react";

import { Eye, EyeOff, Lock } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { Input, InputProps } from "@/ui/components/controls/forms/Input";
import { withController } from "@/ui/components/controls/forms/withController";

export const PasswordInput = (props: InputProps) => {
    const { label = "Mot de passe", onChangeText, caption, error, ...rest } = props;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Input
            label={label}
            onChangeText={onChangeText}
            caption={caption}
            error={error}
            leadingAdornment={Lock}
            secureTextEntry={!showPassword}
            paddingRight="$6"
            placeholder="Mot de passe"
            trailingAdornment={
                <XStack
                    paddingRight="$3"
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {showPassword ? <Eye size="$1" color="$gray9" /> : <EyeOff size="$1" color="$gray9" />}
                </XStack>
            }
            {...rest}
        />
    );
};

export const FormPasswordInput = withController<InputProps>(PasswordInput);
