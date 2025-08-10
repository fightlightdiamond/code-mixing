"use client";

import React, { ReactNode } from "react";
import { useAbility } from "../../core/auth/AbilityProvider";
import { Actions, Subjects } from "../../core/auth/subjects";
import { AuthLogger } from "../../core/auth/auth.logger";
import { useAuth } from "@/contexts/AuthContext";

interface CanProps {
  I: Actions;
  a: Subjects;
  passThrough?: boolean;
  children: ReactNode | ((allowed: boolean) => ReactNode);
}

export default function Can({ I, a, passThrough, children }: CanProps) {
  const ability = useAbility();
  const { user } = useAuth();
  const allowed = ability.can(I, a);

  // Log the authorization check
  if (user) {
    AuthLogger.logAuthorizationCheck(
      user.id,
      user.tenantId || "unknown",
      I,
      typeof a === "string" ? a : "object",
      allowed
    );
  }

  if (typeof children === "function") {
    return <>{children(allowed)}</>;
  }

  if (passThrough) {
    return <>{children}</>;
  }

  return allowed ? <>{children}</> : null;
}
