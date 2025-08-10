"use client";

import Link from "next/link";
import { useAbility } from "@/core/auth/AbilityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLogger } from "@/core/auth/auth.logger";
import { ReactNode } from "react";

interface RoleBasedLinkProps {
  href: string;
  action: string;
  subject: string;
  children: ReactNode;
  className?: string;
}

export function RoleBasedLink({
  href,
  action,
  subject,
  children,
  className,
}: RoleBasedLinkProps) {
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

  // If user doesn't have permission, don't render the link
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

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
