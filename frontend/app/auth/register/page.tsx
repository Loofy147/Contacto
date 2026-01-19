import Link from 'next/link';
import RegistrationForm from '@/components/auth/RegistrationForm';
import { ROUTES } from '@/lib/constants';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            كونتاكتو
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            أو{' '}
            <Link
              href={ROUTES.LOGIN}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              تسجيل الدخول إلى حسابك الحالي
            </Link>
          </p>
        </div>

        <RegistrationForm />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            بإنشائك للحساب، أنت توافق على{' '}
            <Link href="/terms" className="underline hover:text-gray-700">
              شروط الخدمة
            </Link>{' '}
            و{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
