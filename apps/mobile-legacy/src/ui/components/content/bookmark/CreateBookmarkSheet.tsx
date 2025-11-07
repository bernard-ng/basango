import { useState } from "react";

import { joiResolver } from "@hookform/resolvers/joi";
import { Sheet } from "@tamagui/sheet";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { Button, YStack } from "tamagui";

import { useCreateBookmark } from "@/api/request/feed-management/bookmark";
import { BookmarkPayload, BookmarkPayloadSchema } from "@/api/schema/feed-management/bookmark";
import { ErrorResponse, safeMessage } from "@/api/shared";
import { FormSwitch, FormTextArea, FormTextInput } from "@/ui/components/controls/forms";
import { SubmitButton } from "@/ui/components/controls/SubmitButton";

export const CreateBookmarkSheet = () => {
    const { mutate, isPending } = useCreateBookmark();
    const [open, setOpen] = useState(false);

    const { control, handleSubmit, formState } = useForm<BookmarkPayload>({
        resolver: joiResolver(BookmarkPayloadSchema),
    });

    const onSubmit = (data: BookmarkPayload) => {
        mutate(data, {
            onSuccess: () => {
                Toast.show({
                    text1: "Félicitations !",
                    text2: "Votre signet a été créé avec succès.",
                    type: "success",
                });
                setOpen(false);
            },
            onError: (error: ErrorResponse) => {
                Toast.show({
                    text1: "Erreur",
                    text2: safeMessage(error),
                    type: "error",
                });
            },
        });
    };

    return (
        <YStack alignItems="center" justifyContent="center">
            <Button onPress={() => setOpen(true)}>Ajouter un signet</Button>

            <Sheet
                modal={true}
                open={open}
                onOpenChange={setOpen}
                snapPointsMode="percent"
                snapPoints={[65, 90]}
                dismissOnOverlayPress={true}
                dismissOnSnapToBottom={true}
                animation="medium"
            >
                <Sheet.Overlay
                    animation="lazy"
                    backgroundColor="rgba(0, 0, 0, 0.8)"
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Sheet.Frame
                    flex={1}
                    backgroundColor="$background"
                    padding="$4"
                    gap="$4"
                    alignItems="center"
                    justifyContent="flex-start"
                >
                    <YStack width="100%">
                        <Sheet.Handle theme="accent" />
                        <FormTextInput
                            name="name"
                            control={control}
                            label="Name"
                            caption="Enter a name for your bookmark."
                            placeholder="My awesome bookmark"
                        />
                        <FormTextArea
                            name="description"
                            control={control}
                            caption="Describe your bookmark for easy retrieval."
                            label="Description"
                            placeholder="A brief description..."
                        />
                        <FormSwitch
                            name="isPublic"
                            control={control}
                            label="Public"
                            description="A public bookmark is visible and accessible to other users"
                        />
                    </YStack>
                    <SubmitButton
                        label="Créer le signet"
                        onPress={handleSubmit(onSubmit)}
                        isPending={isPending}
                        isValid={formState.isValid}
                    />
                </Sheet.Frame>
            </Sheet>
        </YStack>
    );
};
