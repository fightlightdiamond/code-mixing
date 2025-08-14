import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/core/prisma";
import { getBearerToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = getBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json(
        { message: "Token không hợp lệ" },
        { status: 401 }
      );
    }

    // Verify token - using Prisma generated types
    interface CustomJwtPayload extends JwtPayload {
      userId: string; // UUID from User.id
      email: string;
      role: UserRole; // Use Prisma generated enum
      tenantId?: string; // UUID from User.tenantId
    }
    
    let decoded: CustomJwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as CustomJwtPayload;
    } catch (error) {
      return NextResponse.json(
        { message: "Token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    // For now, we'll use a default tenant ID since the schema doesn't have tenantId
    // In a real implementation, you would fetch the tenantId from the database
    const tenantId = "default-tenant-id";

    // Return user data with tenant information
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Define user roles for CASL
    const roles = [user.role];

    return NextResponse.json({
      user: userData,
      roles: roles,
      tenantId: tenantId,
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { message: "Lỗi server. Vui lòng thử lại sau." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
