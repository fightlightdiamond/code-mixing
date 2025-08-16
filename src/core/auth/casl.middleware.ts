import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAbilities, RequiredRule } from "./casl.guard";

const userSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  roles: z.array(z.string())
});

export function createCaslMiddleware(rules: RequiredRule[]) {
  return async (request: NextRequest) => {
    // Get user from request (this would come from your auth system)
    const user = request.headers.get("x-user");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const result = userSchema.parse(JSON.parse(user));
      const userData = {
        sub: result.id,
        tenantId: result.tenantId,
        roles: result.roles,
      };

      const isAllowed = checkAbilities(rules, userData);

      if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return null;
    } catch (error) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 });
    }
  };
}
