-- ============================================================
-- CONTROL DE OBRAS — SCRIPT 2: CONVERTIR TU USUARIO EN ADMINISTRADOR
-- ============================================================
-- Antes de ejecutar esto:
--   1) Ve a Authentication -> Users -> "Add user" (Agregar usuario).
--   2) Escribe tu correo y una contraseña. Marca la opción
--      "Auto Confirm User" (Confirmar usuario automáticamente) si
--      aparece, para no tener que confirmar el correo.
--   3) Guarda ese usuario.
--
-- Ahora, en este archivo:
--   - Cambia 'correo@ejemplo.com' por el correo que usaste arriba.
--   - Cambia 'Tu Nombre' por tu nombre (opcional).
--   - Pega este archivo completo en el SQL Editor de Supabase y
--     presiona "Run".
--
-- Con esto, tu usuario queda marcado como Administrador. Desde la
-- aplicación (pantalla "Usuarios") podrás crear el resto de las
-- cuentas (empleados, vendedores, residentes de obra) sin volver
-- a tocar Supabase.
-- ============================================================

update public.profiles
set role = 'admin',
    full_name = 'Tu Nombre'
where email = 'correo@ejemplo.com';

-- Verifica que sí haya quedado marcado como administrador:
select id, email, full_name, role from public.profiles where email = 'correo@ejemplo.com';
