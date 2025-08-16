"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildPoliciesQuery,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  type ResourcePolicy,
  type UpsertPolicyInput,
} from "@/features/policies/hooks";

type PolicyEffect = "allow" | "deny";

export default function AdminPoliciesList() {
  const [resourceFilter, setResourceFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ResourcePolicy | null>(null);

  const { data: policies = [], isLoading } = useQuery(
    buildPoliciesQuery({
      resource: resourceFilter || undefined,
      tenantId: tenantFilter || undefined,
    })
  );

  const createMutation = useCreatePolicy({
    resource: resourceFilter || undefined,
    tenantId: tenantFilter || undefined,
  });
  const updateMutation = useUpdatePolicy({
    resource: resourceFilter || undefined,
    tenantId: tenantFilter || undefined,
  });
  const deleteMutation = useDeletePolicy({
    resource: resourceFilter || undefined,
    tenantId: tenantFilter || undefined,
  });

  if (isLoading) {
    return <div className="text-center py-8">Đang tải policies...</div>;
  }

  const onCreate = async (input: UpsertPolicyInput) => {
    await createMutation.mutateAsync(input);
    setShowCreate(false);
  };

  const onUpdate = async (id: number, input: Partial<UpsertPolicyInput>) => {
    await updateMutation.mutateAsync({ id, input });
    setEditing(null);
  };

  const onDelete = async (id: number) => {
    if (!confirm("Xóa policy này?")) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <input
              type="text"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              placeholder="e.g. Story, Lesson, StoryVersion"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
            <input
              type="text"
              value={tenantFilter || ""}
              onChange={(e) => setTenantFilter(e.target.value || null)}
              placeholder="Leave empty for global"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tạo Policy
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">Tìm thấy {policies.length} policies</div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effect</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{p.resource}</td>
                  <td className="px-6 py-4 text-sm">{p.action || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.effect === "deny" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                      {p.effect}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{p.priority}</td>
                  <td className="px-6 py-4 text-sm">{p.tenantId || "global"}</td>
                  <td className="px-6 py-4 text-sm">{p.isActive ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 text-sm truncate max-w-xs" title={p.description || ""}>{p.description || ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" onClick={() => setEditing(p)}>Sửa</button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(p.id)} disabled={deleteMutation.isPending}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {policies.length === 0 && (
          <div className="text-center py-8 text-gray-500">Không có policy</div>
        )}
      </div>

      {showCreate && (
        <PolicyModal
          title="Tạo Policy"
          onClose={() => setShowCreate(false)}
          onSubmit={onCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {editing && (
        <PolicyModal
          title="Sửa Policy"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => onUpdate(editing.id, input)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function PolicyModal({
  title,
  initial,
  onClose,
  onSubmit,
  isLoading,
}: {
  title: string;
  initial?: Partial<ResourcePolicy>;
  onClose: () => void;
  onSubmit: (input: UpsertPolicyInput) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<UpsertPolicyInput>({
    resource: initial?.resource || "",
    action: initial?.action || null,
    effect: (initial?.effect as PolicyEffect) || "deny",
    conditions: (initial?.conditions as Record<string, unknown>) || null,
    priority: initial?.priority ?? 100,
    tenantId: (initial?.tenantId as string | null) ?? null,
    isActive: initial?.isActive ?? true,
    description: initial?.description || "",
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource *</label>
                <input className="w-full px-3 py-2 border rounded-md" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <input className="w-full px-3 py-2 border rounded-md" value={form.action || ""} onChange={(e) => setForm({ ...form, action: e.target.value || null })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Effect *</label>

                <select className="w-full px-3 py-2 border rounded-md" value={form.effect} onChange={(e) => setForm({ ...form, effect: e.target.value as PolicyEffect })}>

                  <option value="allow">allow</option>
                  <option value="deny">deny</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value || "0", 10) || 0 })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.tenantId || ""} onChange={(e) => setForm({ ...form, tenantId: e.target.value || null })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
              <textarea className="w-full px-3 py-2 border rounded-md" rows={4} value={JSON.stringify(form.conditions ?? {}, null, 2)} onChange={(e) => {
                try {
                  const v = JSON.parse(e.target.value || "{}");
                  setForm({ ...form, conditions: v });
                } catch {
                  // ignore parse error, keep last valid
                }
              }} />
              <p className="text-xs text-gray-500 mt-1">Use placeholders like ${"{ctx.userId}"}, ${"{ctx.tenantId}"}</p>
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
