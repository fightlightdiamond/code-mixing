"use client";

import dynamic from "next/dynamic";

const AdminPermissionsList = dynamic(() => import("./AdminPermissionsList"), { ssr: false });

export default function Page() {
  return <AdminPermissionsList />;
}
