'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

interface LoginFormProps {
  redirectPath?: string;
}

export default function LoginForm({ redirectPath = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçersiz e-posta formatı';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Redirect to dashboard or original destination
      router.push(redirectPath);
    } catch (error: any) {
      setServerError(
        error.response?.data?.message ||
        error.message ||
        'Giriş başarısız. Bilgilerinizi kontrol edin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tekrar Hoş Geldiniz</h1>
          <p className="text-gray-600 mt-2">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          <Input
            label="E-posta Adresi"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="ornek@email.com"
            required
          />

          <Input
            label="Şifre"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
            </label>
            <a href="#" className="text-sm text-gray-900 hover:text-gray-800">
              Şifremi unuttum?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <a href="/auth/register" className="text-gray-900 hover:text-gray-800 font-medium">
              Kayıt Ol
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
