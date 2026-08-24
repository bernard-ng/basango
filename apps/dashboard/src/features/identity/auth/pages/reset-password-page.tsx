import { AuthPageLayout } from "../components/auth-page-layout";
import { ResetPasswordForm } from "../components/reset-password-form";

type ResetPasswordPageProps = {
  token?: string;
};

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  return (
    <AuthPageLayout>
      <ResetPasswordForm token={token} />
    </AuthPageLayout>
  );
}
