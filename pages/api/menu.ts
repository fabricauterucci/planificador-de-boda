import type { NextApiRequest, NextApiResponse } from "next";
import { store } from "./_store";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return res.json({ menu: store.menu });
  if (req.method === "POST") {
    const { value } = req.body as { value: string };
    if (!value) return res.status(400).json({ error: "Valor requerido" });
    store.menu.push(value);
    return res.json({ ok: true });
  }
  return res.status(405).end();
}
