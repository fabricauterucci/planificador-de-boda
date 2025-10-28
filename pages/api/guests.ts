import type { NextApiRequest, NextApiResponse } from "next";
import { store } from "./_store";
import { verifyToken } from "@/lib/auth";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken<{ email: string }>(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    // Si es invitado, devolver su RSVP (por email) si existe
    if (user.role === "invitado") {
      const guest = store.guests.find(g => g.email === user.email);
      return res.json({ role: user.role, guest });
    }
    // prometidos y admin ven todo
    return res.json({ role: user.role, guests: store.guests });
  }

  if (req.method === "POST") {
    // Crear RSVP (solo si no existe para ese email)
    const { name, attending, menu, allergies } = req.body as any;
    if (!name || typeof attending !== "boolean" || !menu) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    // Guardar email del usuario
    if (store.guests.some(g => g.email === user.email)) {
      return res.status(409).json({ error: "Ya existe RSVP para este usuario" });
    }
    store.guests.push({ name, attending, menu, allergies, email: user.email });
    return res.json({ ok: true });
  }

  if (req.method === "PUT") {
    // Editar RSVP existente (por email)
    const { name, attending, menu, allergies } = req.body as any;
    if (!name || typeof attending !== "boolean" || !menu) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    const idx = store.guests.findIndex(g => g.email === user.email);
    if (idx === -1) return res.status(404).json({ error: "No existe RSVP para este usuario" });
    store.guests[idx] = { ...store.guests[idx], name, attending, menu, allergies };
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    // Solo admin puede eliminar invitados
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Solo admin puede eliminar invitados" });
    }
    
    const email = req.body?.email || req.query?.email;
    if (!email) {
      return res.status(400).json({ error: "Email requerido" });
    }
    
    const idx = store.guests.findIndex(g => g.email === email);
    if (idx === -1) {
      return res.status(404).json({ error: "Invitado no encontrado" });
    }
    
    store.guests.splice(idx, 1);
    return res.status(200).json({ ok: true, message: `Invitado ${email} eliminado` });
  }

  return res.status(405).end();
}
