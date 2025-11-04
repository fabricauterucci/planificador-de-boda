import type { NextApiRequest, NextApiResponse } from "next";
import { store } from "./_store";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  return res.json(store.event);
}
