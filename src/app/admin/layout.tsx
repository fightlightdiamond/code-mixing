"use client";

import { AdminNav } from "@/components/admin/admin-nav";
import { UserProfileMenu } from "@/components/admin/user-profile-menu";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
              </div>
              <nav className="hidden md:flex">
                <AdminNav />
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} My App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
