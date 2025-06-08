// src/app/login/page.tsx
import AuthForm from '@/components/auth/AuthForm';
import MainLayout from '@/components/layout/MainLayout';

export default function LoginPage() {
  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-12">
        <AuthForm mode="login" />
      </div>
    </MainLayout>
  );
}