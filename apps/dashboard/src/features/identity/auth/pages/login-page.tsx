import { AuthPageLayout } from "../components/auth-page-layout";
import { LoginForm } from "../components/login-form";

type LoginPageProps = {
  returnTo?: string;
};

export function LoginPage({ returnTo }: LoginPageProps) {
  return (
    <AuthPageLayout>
      <LoginForm returnTo={returnTo} />
    </AuthPageLayout>
  );
}
