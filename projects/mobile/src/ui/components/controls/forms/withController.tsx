import React from "react";

import { Controller, ControllerProps } from "react-hook-form";

type WithControllerProps = {
    value?: any;
    onChangeText?: (val: any) => void;
    isChecked?: boolean;
    onCheckedChange?: (val: boolean) => void;
    error?: string;
};

type ControllerWrapperProps<T> = {
    name: string;
    control: ControllerProps<any, any, any>["control"];
} & Omit<T, keyof WithControllerProps>;

export const withController = <T extends WithControllerProps>(Component: React.ComponentType<T>) => {
    const ControllerWrapper = (props: ControllerWrapperProps<T>) => {
        const { name, control, ...rest } = props;

        return (
            <Controller
                name={name}
                control={control}
                render={({ field: { value, onChange }, fieldState: { error } }) => {
                    const hasSwitchProps = "isChecked" in rest || "onCheckedChange" in rest;

                    const controllerProps: WithControllerProps = {
                        error: error?.message,
                    };

                    if (hasSwitchProps) {
                        controllerProps.isChecked = value;
                        controllerProps.onCheckedChange = onChange;
                    } else {
                        controllerProps.value = value;
                        controllerProps.onChangeText = onChange;
                    }

                    return <Component {...(rest as unknown as T)} {...(controllerProps as T)} />;
                }}
            />
        );
    };

    ControllerWrapper.displayName = `withController(${Component.displayName || Component.name || "Component"})`;

    return ControllerWrapper;
};
