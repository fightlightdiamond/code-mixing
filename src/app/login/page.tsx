import { LoginForm } from '@/components/auth/LoginForm';
import { FadeIn } from '@/components/ui/fade-in';

export default function LoginPage() {
  return (
    <FadeIn className="container mx-auto py-8">
      <LoginForm />
    </FadeIn>
  );
}

export const metadata = {
  title: 'Đăng nhập - Edtech',
  description: 'Đăng nhập vào hệ thống học tiếng Anh IT',
};
