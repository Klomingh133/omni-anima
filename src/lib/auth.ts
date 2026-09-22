import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
}

export function verifyAuthToken(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Check query params if any
    const url = new URL(req.url);
    token = url.searchParams.get('token') || '';
  }

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || 'omnianima_jwt_secret_dev_key_blueprint';
    const decoded = jwt.verify(token, secret) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}
