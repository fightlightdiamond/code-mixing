import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from "@/core/prisma";
import { log } from "@/lib/logger";
import type { JWTPayload, ApiResponse, User } from "@/types/api";
import { getBearerToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now();
  log.api('Auth me request started', '/api/auth/me');
  
  try {
    // Get token from Authorization header
    const token = getBearerToken(request.headers.get('authorization'));
    if (!token) {
      log.warn('Missing or invalid authorization header', { endpoint: '/api/auth/me' });
      return NextResponse.json(
        { message: 'Token không hợp lệ', success: false },
        { status: 401 }
      );
    }

    // Verify token with proper typing
    let decoded: JWTPayload;
    const authStartTime = Date.now();
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      decoded = jwt.verify(token, secret) as JWTPayload;
      log.performance('JWT verification completed', Date.now() - authStartTime, {
        endpoint: '/api/auth/me',
        userId: decoded.userId
      });
    } catch (error) {
      log.warn('Invalid or expired JWT token', {
        endpoint: '/api/auth/me',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return NextResponse.json(
        { message: 'Token không hợp lệ hoặc đã hết hạn', success: false },
        { status: 401 }
      );
    }

    // Get user from database
    log.db('Fetching user profile', `SELECT user WHERE id = ${decoded.userId}`);
    const dbStartTime = Date.now();
    
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
    
    log.performance('User profile query completed', Date.now() - dbStartTime, {
      endpoint: '/api/auth/me',
      userId: decoded.userId,
      found: !!user
    });

    if (!user) {
      log.warn('User not found in database', {
        endpoint: '/api/auth/me',
        userId: decoded.userId
      });
      return NextResponse.json(
        { message: 'Người dùng không tồn tại', success: false },
        { status: 404 }
      );
    }

    log.performance('Total auth/me request completed', Date.now() - requestStartTime, {
      endpoint: '/api/auth/me',
      userId: decoded.userId
    });
    
    const response: ApiResponse<User> = {
      data: user as User,
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    log.error('Auth verification error', {
      endpoint: '/api/auth/me',
      duration: Date.now() - requestStartTime
    }, error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { message: 'Lỗi server. Vui lòng thử lại sau.', success: false },
      { status: 500 }
    );
  }
}
