// src/app/signup/page.tsx
import AuthForm from '@/components/auth/AuthForm';
import MainLayout from '@/components/layout/MainLayout';

export default function SignupPage() {
  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-12">
        <AuthForm mode="signup" />
      </div>
    </MainLayout>
  );
}