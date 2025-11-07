import { Input, InputProps } from "@/ui/components/controls/forms/Input";
import { withController } from "@/ui/components/controls/forms/withController";

export const TextInput = (props: InputProps) => {
    const { label, caption, error, leadingAdornment, onChangeText, ...rest } = props;

    return (
        <Input
            label={label}
            caption={caption}
            error={error}
            leadingAdornment={leadingAdornment}
            onChangeText={onChangeText}
            {...rest}
        />
    );
};

export const FormTextInput = withController<InputProps>(TextInput);
