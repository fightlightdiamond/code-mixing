"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildPermissionsQuery,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  type Permission,
  type UpsertPermissionInput,
} from "@/features/iam/permissions/hooks";

const RESOURCE_OPTIONS = [
  "User",
  "Role",
  "Permission",
  "ResourcePolicy",
  "Story",
  "Lesson",
  "Course",
  "Unit",
  "Quiz",
  "QuizResult",
  "Audio",
  "Tag",
];

const ACTION_OPTIONS = ["create", "read", "update", "delete"];

export default function AdminPermissionsList() {
  const [q, setQ] = useState("");
  const [resource, setResource] = useState("");
  const [resourceCustom, setResourceCustom] = useState("");
  const [action, setAction] = useState("");
  const [actionCustom, setActionCustom] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);

  const { data: items = [], isLoading } = useQuery(
    buildPermissionsQuery({ q: q || undefined, resource: resource || undefined, action: action || undefined })
  );

  const createMutation = useCreatePermission({ q, resource, action });
  const updateMutation = useUpdatePermission({ q, resource, action });
  const deleteMutation = useDeletePermission({ q, resource, action });

  const onCreate = async (input: UpsertPermissionInput) => {
    await createMutation.mutateAsync(input);
    setShowCreate(false);
  };

  const onUpdate = async (id: string, input: Partial<UpsertPermissionInput>) => {
    await updateMutation.mutateAsync({ id, input });
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Xóa permission này?")) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) return <div className="py-8 text-center">Đang tải permissions...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="name/slug/resource/action" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md"
                value={RESOURCE_OPTIONS.includes(resource) ? resource : resource ? "__custom__" : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setResourceCustom(resource);
                  } else {
                    setResource(v);
                    setResourceCustom("");
                  }
                }}
              >
                <option value="">All</option>
                {RESOURCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
              {(!RESOURCE_OPTIONS.includes(resource) && (resource || resourceCustom)) && (
                <input
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Custom resource"
                  value={resourceCustom || resource}
                  onChange={(e) => {
                    setResource(e.target.value);
                    setResourceCustom(e.target.value);
                  }}
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md"
                value={ACTION_OPTIONS.includes(action) ? action : action ? "__custom__" : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setActionCustom(action);
                  } else {
                    setAction(v);
                    setActionCustom("");
                  }
                }}
              >
                <option value="">All</option>
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
              {(!ACTION_OPTIONS.includes(action) && (action || actionCustom)) && (
                <input
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Custom action"
                  value={actionCustom || action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setActionCustom(e.target.value);
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tạo Permission</button>
          </div>
        </div>
        <div className="text-sm text-gray-600">Tìm thấy {items.length} permissions</div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{p.name}</td>
                  <td className="px-6 py-4 text-sm">{p.slug}</td>
                  <td className="px-6 py-4 text-sm">{p.resource}</td>
                  <td className="px-6 py-4 text-sm">{p.action}</td>
                  <td className="px-6 py-4 text-sm">{p.isSystem ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" onClick={() => setEditing(p)}>Sửa</button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(p.id)} disabled={deleteMutation.isPending}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <div className="py-8 text-center text-gray-500">Không có permission</div>}
      </div>

      {showCreate && (
        <PermissionModal
          title="Tạo Permission"
          onClose={() => setShowCreate(false)}
          onSubmit={onCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {editing && (
        <PermissionModal
          title="Sửa Permission"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => onUpdate(editing.id, input)}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function PermissionModal({
  title,
  initial,
  onClose,
  onSubmit,
  isLoading,
}: {
  title: string;
  initial?: Partial<Permission>;
  onClose: () => void;
  onSubmit: (input: UpsertPermissionInput) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<UpsertPermissionInput>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    resource: initial?.resource || "",
    action: initial?.action || "",
    description: initial?.description || "",
    isSystem: initial?.isSystem || false,
  });
  const [resourceCustom, setResourceCustom] = useState(
    initial?.resource && !RESOURCE_OPTIONS.includes(initial.resource) ? initial.resource : ""
  );
  const [actionCustom, setActionCustom] = useState(
    initial?.action && !ACTION_OPTIONS.includes(initial.action) ? initial.action : ""
  );

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource *</label>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={RESOURCE_OPTIONS.includes(form.resource) ? form.resource : form.resource ? "__custom__" : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setResourceCustom(form.resource);
                      } else {
                        setForm({ ...form, resource: v });
                        setResourceCustom("");
                      }
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select resource
                    </option>
                    {RESOURCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                  {(!RESOURCE_OPTIONS.includes(form.resource) && (form.resource || resourceCustom)) && (
                    <input
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Custom resource"
                      value={resourceCustom || form.resource}
                      onChange={(e) => {
                        setForm({ ...form, resource: e.target.value });
                        setResourceCustom(e.target.value);
                      }}
                      required
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={ACTION_OPTIONS.includes(form.action) ? form.action : form.action ? "__custom__" : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setActionCustom(form.action);
                      } else {
                        setForm({ ...form, action: v });
                        setActionCustom("");
                      }
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select action
                    </option>
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="__custom__">Custom…</option>
                  </select>
                  {(!ACTION_OPTIONS.includes(form.action) && (form.action || actionCustom)) && (
                    <input
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Custom action"
                      value={actionCustom || form.action}
                      onChange={(e) => {
                        setForm({ ...form, action: e.target.value });
                        setActionCustom(e.target.value);
                      }}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.isSystem ? "true" : "false"} onChange={(e) => setForm({ ...form, isSystem: e.target.value === "true" })}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
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
