"use client";

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Ẩn AppHeader khi ở admin pages vì admin layout có navigation riêng
  const isAdminPath = pathname.startsWith('/admin');
  
  if (isAdminPath) {
    return null;
  }
  
  return <AppHeader />;
}
