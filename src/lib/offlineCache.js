/* ============================================================
   CACHÉ LOCAL (localStorage) para modo sin conexión.

   El backend (Supabase) siempre necesita internet para autenticar
   y leer/escribir datos. Esto NO vuelve la app 100% offline (no hay
   una base de datos local con sincronización de conflictos), pero
   resuelve el caso más común: abrir la app sin conexión y poder
   seguir viendo (y editando en memoria) el último estado conocido,
   en vez de quedarse en una pantalla de error en blanco.
   ============================================================ */

const KEY = "controldeobras.offline_snapshot.v1";

export function saveSnapshot({ profile, projects, profiles, activity }) {
  try {
    const payload = { profile, projects, profiles, activity, savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena, etc.) — no es crítico, se ignora.
  }
}

export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorar
  }
}
