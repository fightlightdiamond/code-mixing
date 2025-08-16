import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { buildAbility } from "@/core/auth/ability";
import { accessibleBy } from "@casl/prisma";
import logger, { log } from "@/lib/logger";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { ApiResponse, User, DatabaseWhereClause, RequiredRule } from "@/types/api";
import bcrypt from "bcryptjs";

// GET /api/users - Lấy danh sách users với search
export async function GET(request: NextRequest) {
  const requestStartTime = Date.now();
  log.api('Users API request started', '/api/users');
  
  try {
    // Get user from request
    const authStartTime = Date.now();
    const user = await getUserFromRequest(request);
    log.performance('User authentication completed', Date.now() - authStartTime, {
      endpoint: '/api/users',
      userId: user?.sub
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access this endpoint
    const rules: RequiredRule[] = [{ action: "read", subject: "User" }];

    // Check if user has required permissions
    const caslStartTime = Date.now();
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    log.performance('CASL authorization completed', Date.now() - caslStartTime, {
      endpoint: '/api/users',
      userId: user.sub,
      allowed: true
    });

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    log.debug('Processing search parameters', { search, endpoint: '/api/users' });

    // Build where clause with proper typing
    const where: DatabaseWhereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Build ability for Prisma filtering
    const ability = buildAbility(undefined, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
    });

    // Get users with ability constraints
    log.db('Starting users database query', undefined, { where });
    const dbStartTime = Date.now();

    const users = await prisma.user.findMany({
      where: { ...where, ...accessibleBy(ability).User },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    
    log.performance('Database query completed', Date.now() - dbStartTime, {
      endpoint: '/api/users',
      recordCount: users.length
    });
    
    log.info('Users query completed successfully', {
      count: users.length,
      endpoint: '/api/users'
    });
    
    log.performance('Total API request completed', Date.now() - requestStartTime, {
      endpoint: '/api/users'
    });
    
    const response: ApiResponse<User[]> = {
      data: users as User[],
      success: true,
      meta: {
        total: users.length
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching users", undefined, error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Tạo user mới
export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to create a user
    const rules: RequiredRule[] = [{ action: "create", subject: "User" }];

    // Check if user has required permissions
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role = "student" } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Create user with default password hash
    const passwordHash = await bcrypt.hash("defaultpassword", 10);

    const userRecord = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(userRecord, { status: 201 });
  } catch (error) {
    logger.error("Error creating user", undefined, error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
