/* ============================================================
   CONFIGURACIÓN DE SUPABASE
   ============================================================
   Este archivo lee la URL y la clave de tu proyecto de Supabase
   desde variables de entorno, para no dejarlas escritas
   directamente en el código.

   PASOS PARA CONECTAR TU PROYECTO:

   1) Copia el archivo ".env.example" (está en la raíz del
      proyecto) y renombra la copia a ".env"

   2) Abre ".env" y reemplaza los dos valores por los tuyos:

        VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
        VITE_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICA-ANON-AQUI

      - La URL: Supabase -> Project Settings -> Data API -> "Project URL"
      - La clave: Supabase -> Project Settings -> API Keys -> "anon" / "public"
        (a veces se llama "Publishable key")

   3) Si publicas en Netlify, agrega esas mismas dos variables en:
      Site settings -> Environment variables (ver el README para el
      paso a paso).

   No necesitas tocar ningún otro archivo del proyecto.
   ============================================================ */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
