import type { NextApiRequest, NextApiResponse } from "next";
import { signToken, Role } from "@/lib/auth";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, password, role } = req.body as { email: string; password: string; role: Role };
  if (!email || !password) return res.status(400).json({ error: "Email y password requeridos" });
  const r: Role = role || "invitado";
  const token = signToken({ email, role: r });
  res.json({ token, role: r });
}
