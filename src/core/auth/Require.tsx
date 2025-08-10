"use client";

import { useAbility } from "@/core/auth/AbilityProvider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLogger } from "./auth.logger";

interface RequireProps {
  action: string;
  subject: string;
  children: ReactNode;
}

export function Require({ action, subject, children }: RequireProps) {
  const ability = useAbility();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Chỉ check khi đã load xong auth
    if (isLoading) return;

    // AUTHENTICATION CHECK: Nếu chưa có user → redirect login
    if (!user) {
      console.log("🔐 No user found, redirecting to login...");
      router.push("/login");
      return;
    }

    // AUTHORIZATION CHECK: Check permissions
    const allowed = ability.can(action, subject);

    if (user) {
      AuthLogger.logAuthorizationCheck(
          user.id,
          user.tenantId || "unknown",
          action,
          subject,
          allowed
      );
    }

    if (!allowed) {
      if (user) {
        AuthLogger.logForbiddenAccess(
            user.id,
            user.tenantId || "unknown",
            action,
            subject,
            "Insufficient permissions"
        );
      }
      router.push("/unauthorized");
    } else {
      console.log("✅ Permission granted!");
      setChecked(true);
    }
  }, [ability, action, subject, router, user, isLoading]);

  // Nếu chưa check xong hoặc đang loading → không render
  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
