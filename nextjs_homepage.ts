// frontend/app/page.tsx
import { Suspense } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { FeaturedProfessionals } from '@/components/professionals/FeaturedProfessionals';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Testimonials } from '@/components/marketing/Testimonials';
import { CTASection } from '@/components/marketing/CTASection';

export default async function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              ابحث عن محترفين موثوقين
              <span className="block mt-2">في الجزائر</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              اكتشف أفضل المحترفين في مجالك - من السباكين إلى المحامين
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mt-8">
              <SearchBar />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-12 pt-8 border-t border-blue-400">
              <div className="text-center">
                <div className="text-3xl font-bold">10,000+</div>
                <div className="text-blue-200 text-sm">محترف مسجل</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50,000+</div>
                <div className="text-blue-200 text-sm">تقييم موثوق</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">48</div>
                <div className="text-blue-200 text-sm">ولاية</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              استكشف حسب الفئة
            </h2>
            <p className="text-gray-600 text-lg">
              اختر من بين مئات التخصصات
            </p>
          </div>

          <Suspense fallback={<CategoryGridSkeleton />}>
            <CategoryGrid />
          </Suspense>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              محترفون موصى بهم
            </h2>
            <p className="text-gray-600 text-lg">
              أفضل المحترفين الموثوقين في منطقتك
            </p>
          </div>

          <Suspense fallback={<ProfessionalGridSkeleton />}>
            <FeaturedProfessionals />
          </Suspense>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <HowItWorks />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ماذا يقول عملاؤنا
            </h2>
            <p className="text-gray-600 text-lg">
              آلاف العملاء الراضين في جميع أنحاء الجزائر
            </p>
          </div>

          <Suspense fallback={<TestimonialsSkeleton />}>
            <Testimonials />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <CTASection />
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center text-center">
            <div className="space-y-2">
              <div className="text-4xl">🔒</div>
              <div className="font-semibold">معاملات آمنة</div>
              <div className="text-sm text-gray-600">حماية بيانات عالية</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">⚡</div>
              <div className="font-semibold">استجابة سريعة</div>
              <div className="text-sm text-gray-600">رد خلال 24 ساعة</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">✓</div>
              <div className="font-semibold">محترفون موثوقون</div>
              <div className="text-sm text-gray-600">تحقق شامل</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">💬</div>
              <div className="font-semibold">دعم 24/7</div>
              <div className="text-sm text-gray-600">نحن هنا للمساعدة</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Skeleton Loaders
function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        </div>
      ))}
    </div>
  );
}

function ProfessionalGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
            <div className="flex items-center space-x-3 mt-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-2 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const metadata = {
  title: 'Contacto - ابحث عن محترفين موثوقين في الجزائر',
  description: 'اكتشف أفضل المحترفين في مجالك - من السباكين إلى المحامين. أكثر من 10,000 محترف موثوق في 48 ولاية.',
  keywords: 'محترفون, خدمات, الجزائر, سباك, كهربائي, محامي',
  openGraph: {
    title: 'Contacto - دليل المحترفين في الجزائر',
    description: 'اكتشف أفضل المحترفين الموثوقين في منطقتك',
    images: ['/og-image.jpg'],
  },
};