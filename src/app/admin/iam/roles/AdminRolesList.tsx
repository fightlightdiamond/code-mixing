"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildRolesQuery,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  type Role,
  type UpsertRoleInput,
} from "@/features/iam/roles/hooks";

export default function AdminRolesList() {
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState("");
  const [tenantScope, setTenantScope] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const { data: items = [], isLoading } = useQuery(
    buildRolesQuery({ q: q || undefined, slug: slug || undefined, tenantScope: tenantScope || undefined })
  );

  const createMutation = useCreateRole({ q, slug, tenantScope });
  const updateMutation = useUpdateRole({ q, slug, tenantScope });
  const deleteMutation = useDeleteRole({ q, slug, tenantScope });

  const onCreate = async (input: UpsertRoleInput) => {
    await createMutation.mutateAsync(input);
    setShowCreate(false);
  };

  const onUpdate = async (id: string, input: Partial<UpsertRoleInput>) => {
    await updateMutation.mutateAsync({ id, input });
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Xóa role này?")) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) return <div className="py-8 text-center">Đang tải roles...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="name/slug" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Scope</label>
            <input value={tenantScope} onChange={(e) => setTenantScope(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="system | tenant | (blank)" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tạo Role</button>
          </div>
        </div>
        <div className="text-sm text-gray-600">Tìm thấy {items.length} roles</div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Scope</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{r.name}</td>
                  <td className="px-6 py-4 text-sm">{r.slug}</td>
                  <td className="px-6 py-4 text-sm">{r.tenantScope || ""}</td>
                  <td className="px-6 py-4 text-sm">{r.isSystem ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" onClick={() => setEditing(r)}>Sửa</button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(r.id)} disabled={deleteMutation.isPending}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="py-8 text-center text-gray-500">Không có role</div>}
      </div>

      {showCreate && (
        <RoleModal
          title="Tạo Role"
          onClose={() => setShowCreate(false)}
          onSubmit={onCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {editing && (
        <RoleModal
          title="Sửa Role"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => onUpdate(editing.id, input)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function RoleModal({
  title,
  initial,
  onClose,
  onSubmit,
  isLoading,
}: {
  title: string;
  initial?: Partial<Role>;
  onClose: () => void;
  onSubmit: (input: UpsertRoleInput) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<UpsertRoleInput>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    tenantScope: initial?.tenantScope ?? null,
    isSystem: initial?.isSystem || false,
    tenantId: initial?.tenantId ?? null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="w-full px-3 py-2 border rounded-md" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input className="w-full px-3 py-2 border rounded-md" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Scope</label>
                <input className="w-full px-3 py-2 border rounded-md" value={form.tenantScope ?? ""} onChange={(e) => setForm({ ...form, tenantScope: e.target.value || null })} placeholder="system | tenant | (blank)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
                <select className="w-full px-3 py-2 border rounded-md" value={form.isSystem ? "true" : "false"} onChange={(e) => setForm({ ...form, isSystem: e.target.value === "true" })}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Id (optional)</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.tenantId ?? ""} onChange={(e) => setForm({ ...form, tenantId: e.target.value || null })} />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Hủy</button>
              <button disabled={isLoading} className="px-4 py-2 rounded-md bg-blue-600 text-white">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
