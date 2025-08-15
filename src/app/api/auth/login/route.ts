import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "@/core/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Use the user's tenantId from the database
    const tenantId = user.tenantId;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Generate access token (shorter expiry)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenantId,
      },
      secret,
      { expiresIn: "15m" } // 15 minutes for access token
    );

    // Generate refresh token (longer expiry)
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: "refresh",
      },
      secret,
      { expiresIn: "7d" } // 7 days for refresh token
    );

    // Return user data (without password) and tokens
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return NextResponse.json({
      message: "Đăng nhập thành công",
      user: userData,
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: "Bearer",
      // Legacy support
      token: accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Lỗi server. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
