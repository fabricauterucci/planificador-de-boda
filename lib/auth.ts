import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";

const SECRET = process.env.JWT_SECRET || "demo_insecure_secret_change_me";

export type Role = "prometidos" | "invitado" | "admin";

export function signToken(payload: { email: string; role: Role }) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken<T = any>(req: NextApiRequest): (T & { role: Role }) | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  try {
    return jwt.verify(token, SECRET) as T & { role: Role };
  } catch {
    return null;
  }
}
