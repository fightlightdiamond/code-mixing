"use client";

import { useAuth, withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

function DashboardPage() {
  const { user, logout } = useAuth();

  const studentFeatures = [
    {
      title: 'Bài học của tôi',
      description: 'Tiếp tục học các bài học tiếng Anh IT',
      icon: BookOpen,
      href: '/lessons',
      color: 'bg-blue-500',
    },
    {
      title: 'Tiến trình học tập',
      description: 'Xem tiến trình và thành tích của bạn',
      icon: BarChart3,
      href: '/progress',
      color: 'bg-green-500',
    },
    {
      title: 'Từ vựng',
      description: 'Ôn tập từ vựng đã học',
      icon: BookOpen,
      href: '/vocabulary',
      color: 'bg-purple-500',
    },
  ];

  const coachFeatures = [
    {
      title: 'Quản lý học viên',
      description: 'Xem và quản lý học viên của bạn',
      icon: Users,
      href: '/coach/students',
      color: 'bg-blue-500',
    },
    {
      title: 'Tạo bài học',
      description: 'Tạo và chỉnh sửa nội dung bài học',
      icon: BookOpen,
      href: '/coach/lessons',
      color: 'bg-green-500',
    },
    {
      title: 'Báo cáo',
      description: 'Xem báo cáo tiến trình học viên',
      icon: BarChart3,
      href: '/coach/reports',
      color: 'bg-purple-500',
    },
  ];

  const adminFeatures = [
    {
      title: 'Quản lý người dùng',
      description: 'Quản lý tất cả người dùng hệ thống',
      icon: Users,
      href: '/admin/users',
      color: 'bg-red-500',
    },
    {
      title: 'Quản lý nội dung',
      description: 'Quản lý bài học và nội dung',
      icon: BookOpen,
      href: '/admin/content',
      color: 'bg-blue-500',
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình và cài đặt hệ thống',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
    },
  ];

  const getFeatures = () => {
    switch (user?.role) {
      case 'coach':
        return coachFeatures;
      case 'admin':
        return adminFeatures;
      default:
        return studentFeatures;
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'coach':
        return 'Giảng viên';
      case 'admin':
        return 'Quản trị viên';
      default:
        return 'Học viên';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Edtech Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Xin chào, <span className="font-medium">{user?.name}</span>
              </span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {getRoleTitle()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Chào mừng trở lại, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            {user?.role === 'student' && 'Hãy tiếp tục hành trình học tiếng Anh IT của bạn.'}
            {user?.role === 'coach' && 'Quản lý và hỗ trợ học viên của bạn.'}
            {user?.role === 'admin' && 'Quản lý và giám sát toàn bộ hệ thống.'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'student' && 'Bài học đã hoàn thành'}
                {user?.role === 'coach' && 'Học viên của tôi'}
                {user?.role === 'admin' && 'Tổng người dùng'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 từ tuần trước
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'student' && 'Từ vựng đã học'}
                {user?.role === 'coach' && 'Bài học đã tạo'}
                {user?.role === 'admin' && 'Bài học trong hệ thống'}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">
                +15 từ tuần trước
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'student' && 'Điểm trung bình'}
                {user?.role === 'coach' && 'Điểm TB học viên'}
                {user?.role === 'admin' && 'Hoạt động hôm nay'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.role === 'admin' ? '89' : '8.5'}
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'người dùng hoạt động' : '+0.3 từ tuần trước'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFeatures().map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                Các hoạt động học tập gần đây của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Hoàn thành bài học "Giới thiệu bản thân"</span>
                  <span className="text-xs text-gray-500 ml-auto">2 giờ trước</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Học 15 từ vựng mới</span>
                  <span className="text-xs text-gray-500 ml-auto">1 ngày trước</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Hoàn thành quiz với điểm 9.2</span>
                  <span className="text-xs text-gray-500 ml-auto">2 ngày trước</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
