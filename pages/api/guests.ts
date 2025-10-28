import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken<{ email: string }>(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    try {
      // Si es invitado, devolver su RSVP (por user_id) si existe
      if (user.role === "invitado") {
        // Buscar el user_id del invitado por su email
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!userData) {
          return res.json({ role: user.role, guest: null });
        }

        // Buscar su RSVP
        const { data: rsvpData } = await supabase
          .from('rsvp')
          .select('*, users!inner(nombre, email)')
          .eq('user_id', userData.id)
          .single();

        return res.json({ role: user.role, guest: rsvpData });
      }

      // prometidos y admin ven todo
      const { data: allGuests } = await supabase
        .from('rsvp')
        .select('*, users!inner(nombre, email, rol)')
        .order('created_at', { ascending: false });

      return res.json({ role: user.role, guests: allGuests });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      // Crear RSVP (solo si no existe para ese email)
      const { name, attending, menu, allergies } = req.body as any;
      
      if (!name || typeof attending !== "boolean" || !menu) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      // Buscar el user_id del usuario actual
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!userData) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Verificar si ya existe RSVP
      const { data: existing } = await supabase
        .from('rsvp')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (existing) {
        return res.status(409).json({ error: "Ya existe RSVP para este usuario" });
      }

      // Crear RSVP
      const { data: newRsvp, error } = await supabase
        .from('rsvp')
        .insert({
          user_id: userData.id,
          asistencia: attending ? 'asistire' : 'no_asistire',
          menu: menu,
          comentario: allergies || ''
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({ ok: true, rsvp: newRsvp });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      // Editar RSVP existente
      // - Usuario normal: solo puede editar su propio RSVP (usa su email del JWT)
      // - Admin: puede editar cualquier RSVP (debe enviar email en el body)
      const { asistencia, menu, comentario, email } = req.body as any;
      
      if (typeof asistencia !== "boolean" && !menu) {
        return res.status(400).json({ error: "Datos inválidos (asistencia o menu requeridos)" });
      }
      
      // Determinar qué email usar
      let targetEmail: string;
      
      if (user.role === "admin" && email) {
        // Admin puede especificar el email del invitado a modificar
        targetEmail = email;
      } else {
        // Usuario normal solo puede modificar su propio RSVP
        targetEmail = user.email;
      }
      
      // Buscar el user_id del usuario objetivo
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', targetEmail)
        .single();

      if (!userData) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Preparar datos de actualización
      const updateData: any = {};
      if (typeof asistencia === "boolean") {
        updateData.asistencia = asistencia ? 'asistire' : 'no_asistire';
      }
      if (menu) {
        updateData.menu = menu;
      }
      if (comentario !== undefined) {
        updateData.comentario = comentario;
      }

      // Actualizar RSVP
      const { data: updatedRsvp, error } = await supabase
        .from('rsvp')
        .update(updateData)
        .eq('user_id', userData.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({ ok: true, rsvp: updatedRsvp });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Solo admin puede eliminar invitados
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Solo admin puede eliminar invitados" });
      }
      
      const email = req.body?.email || req.query?.email;
      if (!email) {
        return res.status(400).json({ error: "Email requerido" });
      }
      
      // Buscar el user_id del usuario a eliminar
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!userData) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Eliminar RSVP
      const { error: rsvpError } = await supabase
        .from('rsvp')
        .delete()
        .eq('user_id', userData.id);

      if (rsvpError) throw rsvpError;

      // Eliminar usuario
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userData.id);

      if (userError) throw userError;

      return res.status(200).json({ ok: true, message: `Usuario ${email} eliminado` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
