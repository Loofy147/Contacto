// frontend/app/professionals/page.tsx
import { Suspense } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterSidebar } from '@/components/professionals/FilterSidebar';
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard';
import { Pagination } from '@/components/ui/Pagination';

interface SearchParams {
  q?: string;
  categoryId?: string;
  wilaya?: string;
  minRating?: string;
  verifiedOnly?: string;
  page?: string;
  sortBy?: string;
}

async function searchProfessionals(params: SearchParams) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.set(key, value);
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/professionals?${queryParams}`,
    {
      next: { revalidate: 60 }, // Revalidate every minute
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch professionals');
  }

  return response.json();
}

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { data } = await searchProfessionals(params);
  const { professionals, pagination } = data;

  const currentPage = Number(params.page) || 1;
  const query = params.q || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Suspense fallback={<FilterSidebarSkeleton />}>
                <FilterSidebar />
              </Suspense>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-right" dir="rtl">
                  {query && (
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      نتائج البحث عن "{query}"
                    </h1>
                  )}
                  <p className="text-gray-600">
                    عثرنا على <span className="font-semibold">{pagination.total}</span> محترف
                    {params.wilaya && ` في ${params.wilaya}`}
                  </p>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">ترتيب حسب:</label>
                  <SortSelect currentSort={params.sortBy} />
                </div>
              </div>
            </div>

            {/* No Results */}
            {professionals.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2" dir="rtl">
                  لم نعثر على أي نتائج
                </h2>
                <p className="text-gray-600 mb-6" dir="rtl">
                  حاول تغيير معايير البحث أو الفلاتر
                </p>
                <button
                  onClick={() => window.location.href = '/professionals'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إعادة تعيين البحث
                </button>
              </div>
            )}

            {/* Results Grid */}
            {professionals.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {professionals.map((professional: any) => (
                    <ProfessionalCard key={professional.id} professional={professional} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      baseUrl="/professionals"
                      searchParams={params}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Sort Select Component
function SortSelect({ currentSort }: { currentSort?: string }) {
  'use client';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('sortBy', value);
    params.set('page', '1'); // Reset to first page
    window.location.href = `?${params.toString()}`;
  };

  return (
    <select
      value={currentSort || 'relevance'}
      onChange={(e) => handleSortChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      dir="rtl"
    >
      <option value="relevance">الأكثر صلة</option>
      <option value="rating">الأعلى تقييماً</option>
      <option value="reviews">الأكثر تقييمات</option>
      <option value="newest">الأحدث</option>
    </select>
  );
}

// Skeleton Loader
function FilterSidebarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'ابحث عن محترفين - Contacto',
  description: 'اعثر على أفضل المحترفين الموثوقين في الجزائر. قارن الأسعار واقرأ التقييمات',
};