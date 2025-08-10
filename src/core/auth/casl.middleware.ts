import { NextRequest, NextResponse } from "next/server";
import { checkAbilities, RequiredRule } from "./casl.guard";

export function createCaslMiddleware(rules: RequiredRule[]) {
  return async (request: NextRequest) => {
    // Get user from request (this would come from your auth system)
    const user = request.headers.get("x-user");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const userData = JSON.parse(user);

      // Check if user has required abilities
      const isAllowed = checkAbilities(rules, userData);

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
