"use client";

import { FieldBasedInput } from "@/components/auth/FieldBasedInput";
import { Require } from "@/core/auth/Require";

export default function ProfilePage() {
  return (
    <Require action="read" subject="User">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>

        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Display Name
            </label>
            <FieldBasedInput
              action="update"
              subject="User"
              field="displayName"
              type="text"
              placeholder="Enter your display name"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <FieldBasedInput
              action="update"
              subject="User"
              field="email"
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Locale
            </label>
            <FieldBasedInput
              action="update"
              subject="User"
              field="locale"
              type="text"
              placeholder="Enter your locale"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Update Profile
          </button>
        </div>
      </div>
    </Require>
  );
}
