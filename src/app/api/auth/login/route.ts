import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@/core/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

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
