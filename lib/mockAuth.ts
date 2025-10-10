import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecret';

export function verifyToken(token: string): { email: string; role: string } | null {
  try {
    return jwt.verify(token, SECRET) as { email: string; role: string };
  } catch {
    return null;
  }
}
