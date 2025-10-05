import { Mail } from "@tamagui/lucide-icons";

import { Input, InputProps } from "@/ui/components/controls/forms/Input";
import { withController } from "@/ui/components/controls/forms/withController";

export const EmailInput = (props: InputProps) => {
    const { label = "Email", caption, error, onChangeText, ...rest } = props;

    return (
        <Input
            label={label}
            caption={caption}
            error={error}
            leadingAdornment={Mail}
            onChangeText={onChangeText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="votre@email.com..."
            {...rest}
        />
    );
};

export const FormEmailInput = withController<InputProps>(EmailInput);
