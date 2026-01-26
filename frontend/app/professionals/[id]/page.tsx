'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MapPin, Phone, Globe, Star, Calendar } from 'lucide-react';

export default function ProfessionalProfile({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8 px-4 font-sans" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-64 bg-gray-200 rounded-xl overflow-hidden">
            {/* Banner placeholder */}
          </div>

          <div className="flex flex-col md:flex-row gap-6 -mt-12 px-6">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex-shrink-0 z-10" />
            <div className="pt-12 md:pt-14 space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">اسم المحترف {params.id}</h1>
              <p className="text-lg text-primary-600 font-medium">خبير نجارة وديكور داخلي</p>
              <div className="flex items-center gap-4 text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> الجزائر العاصمة</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.9 (48 تقييم)</span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>حول المحترف</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed text-lg">
                نحن نقدم خدمات احترافية في مجال النجارة والديكور منذ أكثر من 10 سنوات. نلتزم بالجودة والدقة في المواعيد لإرضاء زبائننا الكرام...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الخدمات والأسعار</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-100">
                {[1, 2, 3].map((s) => (
                  <li key={s} className="py-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">تركيب الخزائن المخصصة</h4>
                      <p className="text-gray-500">مدة العمل التقريبية: 3 أيام</p>
                    </div>
                    <div className="text-right">
                      <span className="text-primary-600 font-bold text-xl font-mono">15,000 د.ج</span>
                      <p className="text-xs text-gray-400">سعر يبدأ من</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader><CardTitle>احجز موعداً</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm text-center">اختر الخدمة والوقت المناسب لك</p>
              <Button className="w-full h-12 text-lg gap-2">
                <Calendar className="w-5 h-5" />
                حجز موعد الآن
              </Button>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span dir="ltr">+213 555 12 34 56</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Globe className="w-5 h-5" />
                  <span>www.pro-site.dz</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
