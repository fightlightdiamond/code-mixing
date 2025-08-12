"use client";

import AdminPoliciesList from "./AdminPoliciesList";

export default function PoliciesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resource Policies</h1>
      <AdminPoliciesList />
    </div>
  );
}
