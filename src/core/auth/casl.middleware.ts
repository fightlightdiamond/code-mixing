import { NextRequest, NextResponse } from "next/server";
import { checkAbilities, RequiredRule } from "./casl.guard";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  roles: z.array(z.string()),
});
type UserPayload = z.infer<typeof UserSchema>;

export function createCaslMiddleware(rules: RequiredRule[]) {
  return async (request: NextRequest) => {
    // Get user from request (this would come from your auth system)
    const user = request.headers.get("x-user");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const parsed = UserSchema.safeParse(JSON.parse(user));
      if (!parsed.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userData: UserPayload = parsed.data;

      // Check if user has required abilities
      const isAllowed = checkAbilities(rules, {
        sub: userData.id,
        tenantId: userData.tenantId,
        roles: userData.roles,
      });

      if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // User is allowed, continue with the request
      return null;
    } catch (error) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 });
    }
  };
}
