import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig.js";

export const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  !SUPABASE_ANON_KEY.includes("TU-CLAVE-PUBLICA");

// Cliente principal: se usa para todo (login, lectura y escritura de datos).
// Mantiene la sesión de quien inició sesión en el navegador.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Cliente secundario: se usa ÚNICAMENTE para crear usuarios nuevos desde la
// pantalla "Usuarios". Al crear un usuario con supabase.auth.signUp(), la
// librería normalmente reemplaza la sesión activa por la del usuario recién
// creado. Usando un cliente separado que NO guarda sesión (persistSession:
// false), el administrador que está creando el usuario nunca pierde su
// propia sesión.
export const supabaseSecondary = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
