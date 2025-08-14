"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { BookOpen, Users, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: "Phương pháp truyện chêm",
      description:
        "Học tiếng Anh tự nhiên thông qua câu chuyện với từ tiếng Anh được chêm vào",
    },
    {
      icon: Zap,
      title: "Phản xạ nhanh",
      description:
        "Tạo phản xạ tự nhiên khi giao tiếp tiếng Anh trong môi trường IT",
    },
    {
      icon: Users,
      title: "Cộng đồng học tập",
      description: "Kết nối với cộng đồng IT và chia sẻ kinh nghiệm học tập",
    },
    {
      icon: Globe,
      title: "Ứng dụng thực tế",
      description:
        "Tập trung vào từ vựng và tình huống thực tế trong công việc IT",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Edtech
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Xin chào, <span className="font-medium">{user.name}</span>
                  </span>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard">
                    <Button>Vào học</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline">Đăng nhập</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Học tiếng Anh IT
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Phong cách Do Thái
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Phương pháp "truyện chêm" độc đáo giúp bạn học tiếng Anh giao tiếp
              IT một cách tự nhiên và hiệu quả. Tạo phản xạ ngôn ngữ thông qua câu
              chuyện thực tế.
            </p>
          </FadeIn>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Link href="/register">
                  <FadeIn
                    whileHover={{ scale: 1.05 }}
                    className="inline-block"
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Bắt đầu học ngay
                    </Button>
                  </FadeIn>
                </Link>
                <Link href="/login">
                  <FadeIn
                    delay={0.1}
                    whileHover={{ scale: 1.05 }}
                    className="inline-block"
                  >
                    <Button size="lg" variant="outline">
                      Đăng nhập
                    </Button>
                  </FadeIn>
                </Link>
              </>
            )}

            {user && (
              <Link href="/dashboard">
                <FadeIn whileHover={{ scale: 1.05 }} className="inline-block">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Tiếp tục học tập
                  </Button>
                </FadeIn>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn phương pháp của chúng tôi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Phương pháp học được thiết kế đặc biệt cho người Việt Nam trong
              lĩnh vực IT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FadeIn
                key={index}
                delay={index * 0.1}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className="text-center shadow-sm">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
              <CardHeader>
                <CardTitle className="text-3xl font-bold mb-4">
                  Sẵn sàng bắt đầu hành trình?
                </CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  Tham gia cùng hàng nghìn IT professionals đang học tiếng Anh
                  hiệu quả
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <Link href="/register">
                    <FadeIn whileHover={{ scale: 1.05 }} className="inline-block">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="bg-white text-blue-600 hover:bg-gray-100"
                      >
                        Đăng ký miễn phí ngay
                      </Button>
                    </FadeIn>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <FadeIn whileHover={{ scale: 1.05 }} className="inline-block">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="bg-white text-blue-600 hover:bg-gray-100"
                      >
                        Vào học ngay
                      </Button>
                    </FadeIn>
                  </Link>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="w-6 h-6" />
            <span className="text-lg font-semibold">Edtech</span>
          </div>
          <p className="text-gray-400 mb-4">
            Học tiếng Anh IT hiệu quả với phương pháp truyện chêm
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-white">
              Về chúng tôi
            </Link>
            <Link href="/contact" className="hover:text-white">
              Liên hệ
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Chính sách
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
