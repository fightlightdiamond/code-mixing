"use client";

import { useAbility } from "@/core/auth/AbilityProvider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface RequireDebugProps {
  action: string;
  subject: string;
  children: ReactNode;
}

export function RequireDebug({ action, subject, children }: RequireDebugProps) {
  const ability = useAbility();
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // Debug info
  const debugInfo = {
    user: {
      id: user?.id,
      email: user?.email,
      role: user?.role,
    },
    ability: {
      hasAbility: !!ability,
      isLoading: isLoading,
    },
    hasRules: !!ability,
    userRoles: user?.role ? [user.role] : [],
    tenantId: user?.id,
    timestamp: new Date().toISOString(),
  };

  useEffect(() => {
    const debug = {
      ...debugInfo,
      isLoading: isLoading,
      hasUser: !!user,
      hasRules: !!ability,
      userRoles: user?.role ? [user.role] : [],
      tenantId: user?.id,
      timestamp: new Date().toISOString()
    };

    console.log("🔍 RequireDebug Info:", debug);

    // Chỉ check khi đã load xong auth
    if (isLoading) {
      console.log("⏳ Still loading auth state...");
      return;
    }

    // Nếu chưa có user hoặc rules, coi như chưa xác thực
    if (!user || !ability) {
      console.log("❌ No user or ability:", { user: !!user, ability: !!ability });
      router.push("/login");
      return;
    }

    const allowed = ability.can(action, subject);
    console.log(`🔐 Permission check: ${action} on ${subject} = ${allowed}`);

    if (!allowed) {
      console.log("🚫 Access denied, redirecting to /unauthorized");
      router.push("/unauthorized");
    } else {
      console.log("✅ Access granted!");
      setChecked(true);
    }
  }, [ability, action, subject, router, user, isLoading, debugInfo]);

  // Debug UI
  if (!checked) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Debug: Permission Check</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Action:</strong> {action}</div>
          <div><strong>Subject:</strong> {subject}</div>
          <div><strong>Loading:</strong> {isLoading ? "Yes" : "No"}</div>
          <div><strong>Has User:</strong> {!!user ? "Yes" : "No"}</div>
          <div><strong>Has Rules:</strong> {debugInfo.hasRules ? "Yes" : "No"}</div>
          <div><strong>User Roles:</strong> {debugInfo.userRoles?.join(", ") || "N/A"}</div>
          <div><strong>Tenant ID:</strong> {debugInfo.tenantId || "N/A"}</div>
          <div><strong>Checked:</strong> {checked ? "Yes" : "No"}</div>
        </div>
        {!isLoading && (!user || !debugInfo.hasRules) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>Issue:</strong> Missing authentication data. Please check login status.
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
