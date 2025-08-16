import type { NextApiRequest, NextApiResponse } from "next";
import { store } from "./_store";
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  return res.json(store.event);
}
