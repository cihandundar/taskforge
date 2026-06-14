'use client';

import { useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <LoginForm redirectPath={redirect} />
    </div>
  );
}
