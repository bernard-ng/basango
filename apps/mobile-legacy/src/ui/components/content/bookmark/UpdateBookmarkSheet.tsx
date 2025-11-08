import { joiResolver } from "@hookform/resolvers/joi";
import { Sheet } from "@tamagui/sheet";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Toast from "react-native-toast-message";
import { Button, YStack } from "tamagui";

import { useUpdateBookmark } from "@/api/request/feed-management/bookmark";
import {
  Bookmark,
  BookmarkPayload,
  BookmarkPayloadSchema,
} from "@/api/schema/feed-management/bookmark";
import { ErrorResponse, safeMessage } from "@/api/shared";
import { FormSwitch } from "@/ui/components/controls/forms/Switch";
import { FormTextArea } from "@/ui/components/controls/forms/TextArea";
import { FormTextInput } from "@/ui/components/controls/forms/TextInput";
import { SubmitButton } from "@/ui/components/controls/SubmitButton";

type UpdateBookmarkSheetProps = {
  data: Bookmark;
};

export const UpdateBookmarkSheet = (props: UpdateBookmarkSheetProps) => {
  const { data } = props;
  const { mutate, isPending } = useUpdateBookmark(data.id);
  const [open, setOpen] = useState(false);

  const { control, handleSubmit, formState, reset } = useForm<BookmarkPayload>({
    resolver: joiResolver(BookmarkPayloadSchema),
  });

  useEffect(() => {
    reset({ ...data });
  }, [data, reset]);

  const onSubmit = (data: BookmarkPayload) => {
    mutate(data, {
      onError: (error: ErrorResponse) => {
        Toast.show({
          text1: "Erreur",
          text2: safeMessage(error),
          type: "error",
        });
      },
      onSuccess: () => {
        Toast.show({
          text1: "Félicitations !",
          text2: "Votre signet a été modifié avec succès.",
          type: "success",
        });
        setOpen(false);
      },
    });
  };

  return (
    <YStack alignItems="center" justifyContent="center">
      <Button onPress={() => setOpen(true)}>Modifier</Button>

      <Sheet
        animation="medium"
        dismissOnOverlayPress={true}
        dismissOnSnapToBottom={true}
        modal={true}
        onOpenChange={setOpen}
        open={open}
        snapPoints={[65, 90]}
        snapPointsMode="percent"
      >
        <Sheet.Overlay
          animation="lazy"
          backgroundColor="rgba(0, 0, 0, 0.8)"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame
          alignItems="center"
          backgroundColor="$background"
          flex={1}
          gap="$4"
          justifyContent="flex-start"
          padding="$4"
        >
          <YStack width="100%">
            <Sheet.Handle theme="accent" />
            <FormTextInput
              caption="Enter a name for your bookmark."
              control={control}
              label="Name"
              name="name"
              placeholder="My awesome bookmark"
            />
            <FormTextArea
              caption="Describe your bookmark for easy retrieval."
              control={control}
              label="Description"
              name="description"
              placeholder="A brief description..."
            />
            <FormSwitch
              control={control}
              description="A public bookmark is visible and accessible to other users"
              label="Public"
              name="isPublic"
            />
          </YStack>
          <SubmitButton
            isPending={isPending}
            isValid={formState.isValid}
            label="Modifier le signet"
            onPress={handleSubmit(onSubmit)}
          />
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
};
