"use client";
import { logger } from '@/lib/logger';

import { useAuth } from "@/contexts/AuthContext";
import { useAbility } from "@/core/auth/AbilityProvider";
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export default function AuthDebugger() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const ability = useAbility();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const debug = {
      timestamp: new Date().toISOString(),
      isLoading,
      isAuthenticated,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      } : null,
      permissions: {
        canReadStory: ability.can('read', 'Story'),
        canManageStory: ability.can('manage', 'Story'),
        canCreateStory: ability.can('create', 'Story'),
        canUpdateStory: ability.can('update', 'Story'),
        canDeleteStory: ability.can('delete', 'Story'),
      }
    };

    logger.info("Auth Debug Info", debug);
    setDebugInfo(debug);
  }, [user, isLoading, isAuthenticated, ability]);

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-blue-800 mb-4">🔍 Auth Debug Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth State */}
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-800 mb-3">Auth State</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Loading:</strong> <span className={isLoading ? "text-orange-600" : "text-green-600"}>{isLoading ? "Yes" : "No"}</span></div>
            <div><strong>Authenticated:</strong> <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>{isAuthenticated ? "Yes" : "No"}</span></div>
            <div><strong>Has User:</strong> <span className={user ? "text-green-600" : "text-red-600"}>{user ? "Yes" : "No"}</span></div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-800 mb-3">User Info</h3>
          {user ? (
            <div className="space-y-2 text-sm">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.role}</span></div>
              <div><strong>Tenant:</strong> {user.tenantId || "None"}</div>
            </div>
          ) : (
            <div className="text-red-600 text-sm">No user data</div>
          )}
        </div>

        {/* AbilityProvider Info */}
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-800 mb-3">Ability Provider</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> <span className={ability ? "text-green-600" : "text-red-600"}>{ability ? "Active" : "Not Available"}</span></div>
            <div><strong>Rules Source:</strong> Built from user role</div>
            <div><strong>Context:</strong> AuthContextBridge → AbilityProvider</div>
          </div>
        </div>

        {/* Permissions Check */}
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-800 mb-3">Story Permissions</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(debugInfo.permissions || {}).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> 
                <span className={value ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                  {value ? "✅ Allowed" : "❌ Denied"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-4">
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
        <button 
          onClick={() => window.location.href = '/admin/users'}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Check Admin Users
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh Page
        </button>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">🔧 Debug Recommendations:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          {isLoading && <li>• Auth is loading - Wait for auth state to initialize</li>}
          {!isLoading && !user && <li>• User not found - Check if login is working or auth token is valid</li>}
          {user && !debugInfo.permissions?.canReadStory && (
            <li>• No Story read permission - Check if user role "{user.role}" has Story permissions in ability.ts</li>
          )}
          {!ability && <li>• AbilityProvider not working - Check AuthContextBridge integration</li>}
          <li>• Try running database seed: <code className="bg-yellow-100 px-1 rounded">npm run db:seed</code></li>
          <li>• Check if admin user exists in database with correct roles</li>
        </ul>
      </div>
    </div>
  );
}
