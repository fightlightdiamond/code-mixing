"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FadeIn } from '@/components/ui/fade-in';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const router = useRouter();

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'coach':
        return '/coach';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <FadeIn>
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Không có quyền truy cập
            </CardTitle>
            <CardDescription className="text-gray-600">
              Bạn không có quyền truy cập vào trang này
            </CardDescription>
          </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Trang bạn đang cố gắng truy cập yêu cầu quyền cao hơn.
            </p>
            
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Tài khoản hiện tại:</span> {user.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Vai trò:</span> {
                    user.role === 'student' ? 'Học viên' :
                    user.role === 'coach' ? 'Giảng viên' : 'Quản trị viên'
                  }
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => router.back()}
              variant="outline" 
              className="w-full flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang trước</span>
            </Button>

            <Link href={getDashboardPath()}>
              <Button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
