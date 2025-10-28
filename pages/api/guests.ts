import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Forzar Node.js runtime (necesario para Supabase)
export const runtime = "nodejs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[API /api/guests] ${req.method} request received`);
  
  const user = verifyToken<{ email: string }>(req);
  if (!user) {
    console.log('[API /api/guests] Unauthorized - no valid token');
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  console.log(`[API /api/guests] User authenticated: ${user.email} (${user.role})`);

  if (req.method === "GET") {
    try {
      // Solo admin y prometidos pueden ver la lista completa
      if (user.role !== "admin" && user.role !== "prometidos") {
        return res.status(403).json({ error: "No autorizado" });
      }

      // Devolver todos los RSVPs con JOIN a users
      const { data: allGuests } = await supabaseAdmin
        .from('rsvp')
        .select('*, users!inner(nombre, rol)')
        .order('created_at', { ascending: false });

      return res.json({ role: user.role, guests: allGuests });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      // Crear RSVP - Solo admin puede crear desde esta API
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Solo admin puede crear invitados desde esta API" });
      }
      
      const { user_id, asistencia, menu, comentario } = req.body as any;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id requerido" });
      }

      // Verificar si ya existe RSVP
      const { data: existing } = await supabaseAdmin
        .from('rsvp')
        .select('id')
        .eq('user_id', user_id)
        .single();

      if (existing) {
        return res.status(409).json({ error: "Ya existe RSVP para este usuario" });
      }

      // Crear RSVP
      const { data: newRsvp, error } = await supabaseAdmin
        .from('rsvp')
        .insert({
          user_id: user_id,
          asistencia: asistencia || 'no_confirmado',
          menu: menu || '',
          comentario: comentario || ''
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
    console.log('[API /api/guests] PUT - Iniciando edición');
    console.log('[API /api/guests] Body recibido:', req.body);
    console.log('[API /api/guests] Body type:', typeof req.body);
    
    try {
      // Admin solo puede editar el menú, NO la asistencia
      const { menu, comentario, user_id } = req.body as any;
      
      console.log('[API /api/guests] Parsed:', { 
        menu, 
        comentario, 
        user_id 
      });
      
      if (!user_id) {
        console.log('[API /api/guests] user_id requerido');
        return res.status(400).json({ error: "user_id requerido" });
      }
      
      // Validar que al menos menu esté presente
      if (!menu) {
        console.log('[API /api/guests] Menu requerido');
        return res.status(400).json({ error: "Menu requerido" });
      }
      
      // Solo admin puede editar
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Solo admin puede editar RSVPs" });
      }

      // Preparar datos de actualización (solo menú y comentario)
      const updateData: any = {
        menu: menu
      };
      
      if (comentario !== undefined) {
        updateData.comentario = comentario;
      }

      console.log('[API /api/guests] Update data:', updateData);
      console.log('[API /api/guests] Target user_id:', user_id);

      // Actualizar RSVP
      const { data: updatedRsvp, error } = await supabaseAdmin
        .from('rsvp')
        .update(updateData)
        .eq('user_id', user_id)
        .select()
        .single();

      console.log('[API /api/guests] Supabase response:', { updatedRsvp, error });

      if (error) {
        console.error('[API /api/guests] Error updating RSVP:', error);
        throw new Error(`Error de Supabase: ${error.message} (${error.code})`);
      }

      if (!updatedRsvp) {
        console.error('[API /api/guests] No se encontró RSVP para actualizar');
        return res.status(404).json({ error: "RSVP no encontrado para este usuario" });
      }

      console.log('[API /api/guests] Success! Returning 200');
      return res.status(200).json({ ok: true, rsvp: updatedRsvp });
    } catch (error: any) {
      console.error('[API /api/guests] PUT error:', error);
      console.error('[API /api/guests] Error stack:', error.stack);
      return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Solo admin puede eliminar invitados
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Solo admin puede eliminar invitados" });
      }
      
      // Recibir user_id (UUID)
      const userId = req.body?.user_id || req.query?.user_id;
      
      if (!userId) {
        return res.status(400).json({ error: "user_id requerido" });
      }

      // Eliminar RSVP
      const { error: rsvpError } = await supabaseAdmin
        .from('rsvp')
        .delete()
        .eq('user_id', userId);

      if (rsvpError) throw rsvpError;

      // Eliminar usuario
      const { error: userError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) throw userError;

      return res.status(200).json({ ok: true, message: `Usuario eliminado correctamente` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
