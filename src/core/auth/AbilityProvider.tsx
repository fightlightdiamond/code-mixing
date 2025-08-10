"use client";

import React, { createContext, useContext, useMemo } from "react";
import { AppAbility, buildAbility } from "./ability";

interface AbilityContextType {
  ability: AppAbility;
}

const AbilityContext = createContext<AppAbility | null>(null);

export default function AbilityProvider({
  children,
  rules,
  user,
}: {
  children: React.ReactNode;
  rules: any[] | null;
  user: { id: string; roles: string[]; tenantId?: string } | null;
}) {
  const ability = useMemo(
    () =>
      buildAbility(rules ?? undefined, {
        userId: user?.id,
        roles: user?.roles,
        tenantId: user?.tenantId,
      }),
    [rules, user]
  );

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error("useAbility must be used within an AbilityProvider");
  }
  return ability;
}
