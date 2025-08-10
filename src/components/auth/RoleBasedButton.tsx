"use client";

import { useAbility } from "@/core/auth/AbilityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLogger } from "@/core/auth/auth.logger";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface RoleBasedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action: string;
  subject: string;
  children: ReactNode;
}

export function RoleBasedButton({
  action,
  subject,
  children,
  ...props
}: RoleBasedButtonProps) {
  const ability = useAbility();
  const { user } = useAuth();

  // Check if user has permission
  const allowed = ability.can(action, subject);

  // Log the authorization check
  if (user) {
    AuthLogger.logAuthorizationCheck(
      user.id,
      user.tenantId || "unknown",
      action,
      subject,
      allowed
    );
  }

  // If user doesn't have permission, don't render the button
  if (!allowed) {
    // Log forbidden access
    if (user) {
      AuthLogger.logForbiddenAccess(
        user.id,
        user.tenantId || "unknown",
        action,
        subject,
        "Insufficient permissions"
      );
    }

    return null;
  }

  return <button {...props}>{children}</button>;
}
