import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";

export async function GET(request: NextRequest) {
  try {
    const userCtx = await getUserFromRequest(request);
    if (!userCtx) {
      return NextResponse.json({ message: "Token không hợp lệ" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userCtx.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
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

    // Return user data with tenant information
    const userData: {
      id: string;
      name: string | null;
      email: string;
      role: UserRole;
      tenantId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Define user roles for CASL
    const roles: UserRole[] = [user.role];

    return NextResponse.json({
      user: userData,
      roles,
      tenantId: user.tenantId,
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { message: "Lỗi server. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
