-- ============================================================
-- CONTROL DE OBRAS — SCRIPT 1: BASE DE DATOS COMPLETA
-- ============================================================
-- Qué hacer con este archivo:
--   1) Entra a tu proyecto de Supabase.
--   2) Ve al menú "SQL Editor" (editor SQL).
--   3) Pega TODO este archivo y presiona "Run" (Ejecutar).
--   4) Solo lo haces UNA vez.
--
-- Esto crea:
--   - Todas las tablas que usa la aplicación (proyectos, ítems,
--     ingresos, egresos, materiales, mano de obra, maquinaria,
--     gastos de operación, programación y actividad).
--   - Una tabla "profiles" que guarda el nombre y el rol
--     (Administrador / Residente) de cada persona que use la app.
--   - Reglas de seguridad (RLS) para que cada residente solo vea
--     los proyectos que le asignes, y el administrador vea todo.
--   - Un mecanismo automático: cuando se crea un usuario nuevo en
--     Authentication, se le crea su fila en "profiles" sola.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABLAS
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'residente' check (role in ('admin', 'residente')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  name text not null,
  code text,
  client text,
  location text,
  start_date date,
  end_date date,
  budget numeric not null default 0,
  resident text,
  resident_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'En ejecución',
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  description text,
  unit text,
  qty numeric not null default 0,
  pu numeric not null default 0,
  primary key (project_id, id)
);

create table if not exists public.executions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  item_id text,
  date date,
  qty numeric not null default 0
);

create table if not exists public.income (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  type text,
  amount numeric not null default 0,
  date date,
  doc text,
  description text
);

create table if not exists public.expenses (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  category text,
  amount numeric not null default 0,
  date date,
  doc text,
  doc_type text,
  provider text,
  pay text,
  description text
);

create table if not exists public.materials (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  date date,
  material text,
  unit text,
  qty numeric not null default 0,
  item_id text,
  pu numeric not null default 0,
  pay text,
  provider text
);

create table if not exists public.labor_daily (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  pay_type text default 'jornal',
  date date,
  worker text,
  category text,
  shift text,
  hours numeric default 0,
  wage numeric default 0,
  month text,
  monthly_salary numeric default 0,
  days_worked numeric default 0
);

create table if not exists public.machinery (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  date date,
  machine text,
  item_id text,
  shift text,
  hor_ini numeric,
  hor_fin numeric,
  hours numeric default 0,
  rate numeric default 0
);

create table if not exists public.operating (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  date date,
  category text,
  amount numeric not null default 0,
  description text
);

create table if not exists public.schedule (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  date date,
  planned_pct numeric not null default 0
);

create table if not exists public.activity_log (
  id text primary key,
  project_id text references public.projects(id) on delete cascade,
  message text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Índices para que los filtros por proyecto sean rápidos.
create index if not exists idx_executions_project on public.executions(project_id);
create index if not exists idx_income_project on public.income(project_id);
create index if not exists idx_expenses_project on public.expenses(project_id);
create index if not exists idx_materials_project on public.materials(project_id);
create index if not exists idx_labor_daily_project on public.labor_daily(project_id);
create index if not exists idx_machinery_project on public.machinery(project_id);
create index if not exists idx_operating_project on public.operating(project_id);
create index if not exists idx_schedule_project on public.schedule(project_id);
create index if not exists idx_activity_log_project on public.activity_log(project_id);
create index if not exists idx_projects_resident_user on public.projects(resident_user_id);

-- ------------------------------------------------------------
-- FUNCIÓN AUXILIAR: ¿la persona que inició sesión es administrador?
-- (security definer = puede leer "profiles" sin chocar con sus
-- propias reglas de seguridad; evita recursión infinita)
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) = 'admin',
    false
  );
$$;

-- ------------------------------------------------------------
-- CREACIÓN AUTOMÁTICA DE PERFIL AL CREAR UN USUARIO
-- Cada vez que se crea un usuario en Authentication (ya sea
-- manualmente desde el panel, o desde la pantalla "Usuarios" de
-- la app), se le crea automáticamente su fila en "profiles" con
-- rol "residente" por defecto. El administrador puede luego
-- cambiar ese rol (el Script 2 lo hace para el primer usuario).
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'residente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- SEGURIDAD (RLS): activar en todas las tablas
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.items enable row level security;
alter table public.executions enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.materials enable row level security;
alter table public.labor_daily enable row level security;
alter table public.machinery enable row level security;
alter table public.operating enable row level security;
alter table public.schedule enable row level security;
alter table public.activity_log enable row level security;

-- profiles: cada quien ve su propio perfil; el administrador ve todos.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (public.is_admin() or auth.uid() = id);

-- projects: el administrador puede todo; el residente solo ve/edita
-- el proyecto que tiene asignado (resident_user_id).
drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects for select
  using (public.is_admin() or resident_user_id = auth.uid());

drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects for insert
  with check (public.is_admin());

drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects for update
  using (public.is_admin());

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects for delete
  using (public.is_admin());

-- Tablas "hijas": mismo criterio, revisando el proyecto dueño de cada fila.
-- (una política por tabla; se repite el mismo patrón para las 9 tablas)

drop policy if exists "items_all" on public.items;
create policy "items_all" on public.items for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = items.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = items.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "executions_all" on public.executions;
create policy "executions_all" on public.executions for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = executions.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = executions.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "income_all" on public.income;
create policy "income_all" on public.income for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = income.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = income.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "expenses_all" on public.expenses;
create policy "expenses_all" on public.expenses for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = expenses.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = expenses.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "materials_all" on public.materials;
create policy "materials_all" on public.materials for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = materials.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = materials.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "labor_daily_all" on public.labor_daily;
create policy "labor_daily_all" on public.labor_daily for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = labor_daily.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = labor_daily.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "machinery_all" on public.machinery;
create policy "machinery_all" on public.machinery for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = machinery.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = machinery.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "operating_all" on public.operating;
create policy "operating_all" on public.operating for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = operating.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = operating.project_id and p.resident_user_id = auth.uid()
  ));

drop policy if exists "schedule_all" on public.schedule;
create policy "schedule_all" on public.schedule for all
  using (public.is_admin() or exists (
    select 1 from public.projects p where p.id = schedule.project_id and p.resident_user_id = auth.uid()
  ))
  with check (public.is_admin() or exists (
    select 1 from public.projects p where p.id = schedule.project_id and p.resident_user_id = auth.uid()
  ));

-- activity_log: cualquier persona con sesión puede avisar algo;
-- solo el administrador puede leer las notificaciones.
drop policy if exists "activity_log_insert" on public.activity_log;
create policy "activity_log_insert" on public.activity_log for insert
  with check (auth.uid() is not null);

drop policy if exists "activity_log_select" on public.activity_log;
create policy "activity_log_select" on public.activity_log for select
  using (public.is_admin());

-- ============================================================
-- FIN DEL SCRIPT 1. Sigue con el Script 2 (02_hacer_administrador.sql)
-- después de crear tu primer usuario en Authentication.
-- ============================================================
