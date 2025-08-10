"use client";

import { useAbility } from "@/core/auth/AbilityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLogger } from "@/core/auth/auth.logger";
import { InputHTMLAttributes } from "react";

interface FieldBasedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  action: string;
  subject: string;
  field: string;
}

export function FieldBasedInput({
  action,
  subject,
  field,
  ...props
}: FieldBasedInputProps) {
  const ability = useAbility();
  const { user } = useAuth();

  // Check if user has permission to access this field
  const allowed = ability.can(action, subject, field);

  // Log the field access check
  if (user) {
    AuthLogger.logAuthorizationCheck(
      user.id,
      user.tenantId || "unknown",
      action,
      `${subject}.${field}`,
      allowed
    );
  }

  // If user doesn't have permission to access this field, don't render the input
  if (!allowed) {
    // Log forbidden access
    if (user) {
      AuthLogger.logForbiddenAccess(
        user.id,
        user.tenantId || "unknown",
        action,
        `${subject}.${field}`,
        "Insufficient permissions for this field"
      );
    }

    return null;
  }

  return <input {...props} />;
}
