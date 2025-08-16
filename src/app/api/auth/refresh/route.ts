import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { verifyJwt } from "@/core/auth/jwt";

import { prisma } from "@/core/prisma";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token không được cung cấp' },
        { status: 400 }
      );
    }

    // Verify refresh token
    interface CustomJwtPayload extends JwtPayload {
      userId: string;
      email: string;
      roles?: string[];
    }
    
    let decoded: CustomJwtPayload;
    try {
      decoded = verifyJwt<CustomJwtPayload>(refreshToken);
    } catch (error) {
      if (error instanceof Error && error.message === 'JWT secret is not configured') {
        throw error;
      }
      return NextResponse.json(
        { message: 'Refresh token không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET!;

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa' },
        { status: 404 }
      );
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      secret,
      { expiresIn: '15m' } // Shorter expiry for access token
    );

    // Generate new refresh token (optional - for rotation)
    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });

  } catch (error) {
    logger.error('Token refresh error', undefined, error);
    return NextResponse.json(
      { message: 'Lỗi server. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
