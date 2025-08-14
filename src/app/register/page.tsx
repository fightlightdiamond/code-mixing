import { RegisterForm } from '@/components/auth/RegisterForm';
import { FadeIn } from '@/components/ui/fade-in';

export default function RegisterPage() {
  return (
    <FadeIn className="container mx-auto py-8">
      <RegisterForm />
    </FadeIn>
  );
}

export const metadata = {
  title: 'Đăng ký - Edtech',
  description: 'Tạo tài khoản mới để học tiếng Anh IT',
};
