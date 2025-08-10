import { RequiredRule } from "./casl.guard";

export const CHECK_ABILITY = "check_ability";

export interface CheckAbilitiesOptions {
  rules: RequiredRule[];
}

export const CheckAbilities = (...rules: RequiredRule[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // For Next.js API routes, we'll store the metadata differently
    // This is a simplified approach for demonstration
    if (!target.constructor.caslRules) {
      target.constructor.caslRules = {};
    }
    target.constructor.caslRules[propertyKey] = rules;
  };
};
