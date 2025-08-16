"use client";
import { logger } from '@/lib/logger';

import React, { createContext, useContext, useMemo } from "react";
import { AppAbility, buildAbility, ServerRule, type AbilityContext } from "./ability";

// Remove unused interface

interface UserContext {
  id: string;
  roles: string[];
  tenantId?: string;
}

const AbilityContext = createContext<AppAbility | null>(null);

interface AbilityProviderProps {
  children: React.ReactNode;
  rules: ServerRule[] | null;
  user: UserContext | null;
}

export default function AbilityProvider({
  children,
  rules,
  user,
}: AbilityProviderProps) {
  const ability = useMemo(() => {
    try {
      // Validate user context
      if (user && (!user.id || !Array.isArray(user.roles))) {
        logger.warn('Invalid user context provided to AbilityProvider');
        return buildAbility(undefined, undefined);
      }

      // Validate rules if provided
      if (rules && !Array.isArray(rules)) {
        logger.warn('Invalid rules provided to AbilityProvider, expected array');
        return buildAbility(undefined, {
          userId: user?.id,
          roles: user?.roles || [],
          tenantId: user?.tenantId,
        });
      }

      const context: AbilityContext | undefined = user ? {
        userId: user.id,
        roles: user.roles,
        tenantId: user.tenantId,
      } : undefined;

      return buildAbility(rules ?? undefined, context);
    } catch (error) {
      logger.error('Error building ability in AbilityProvider:', error);
      // Return a default ability with no permissions as fallback
      return buildAbility(undefined, undefined);
    }
  }, [rules, user]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error(
      "useAbility must be used within an AbilityProvider. " +
      "Make sure your component is wrapped with <AbilityProvider>."
    );
  }
  return ability;
}

// Helper hook to safely use ability with error boundary
export function useSafeAbility(): AppAbility | null {
  try {
    return useAbility();
  } catch (error) {
    logger.error('Error accessing ability context:', error);
    return null;
  }
}
