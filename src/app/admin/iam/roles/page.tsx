"use client";

import dynamic from "next/dynamic";

const AdminRolesList = dynamic(() => import("./AdminRolesList"), { ssr: false });

export default function Page() {
  return <AdminRolesList />;
}
