/**
 * صفحة تسجيل الدخول مع التحقق من البيانات ومعالجة الأخطاء
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { authSchemas } from '@/lib/validations/schemas';
import { useUIStore } from '@/lib/store';
import { ROUTES } from '@/lib/constants';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = authSchemas.login.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        formattedErrors[path] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(formData);
      addNotification({
        type: 'success',
        message: 'تم تسجيل الدخول بنجاح! جاري التوجيه...',
      });
      router.push(ROUTES.DASHBOARD_OVERVIEW);
    } catch (error: any) {
      const errorMessage = error.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      setErrors({ general: errorMessage });
      addNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            كونتاكتو
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            تسجيل الدخول إلى حسابك
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            أو{' '}
            <Link
              href={ROUTES.REGISTER}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="p-4 rounded-md bg-red-50 flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="البريد الإلكتروني"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              disabled={isLoading}
            />

            <div className="relative">
              <Input
                label="كلمة المرور"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="mr-2 block text-sm text-gray-900">
                تذكرني
              </label>
            </div>

            <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary-600 hover:text-primary-500">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
}
