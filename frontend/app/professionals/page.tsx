'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter } from 'lucide-react';

export default function ProfessionalsDirectory() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="container mx-auto py-8 px-4 font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">دليل المحترفين</h1>
        <div className="relative w-full md:max-w-md">
          <Input
            placeholder="ابحث عن محترف أو خدمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-48 bg-gray-200 rounded-t-lg" />
            <CardHeader>
              <CardTitle>اسم المحترف {i}</CardTitle>
              <p className="text-sm text-primary-600 font-medium">النجارة والديكور</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-2">هذا نص تجريبي لوصف خدمة المحترف وخبرته في هذا المجال...</p>
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>الجزائر العاصمة</span>
                <span>⭐ 4.8 (24 تقييم)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
