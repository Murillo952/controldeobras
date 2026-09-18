import { supabase, supabaseSecondary } from "./supabaseClient.js";

/* ============================================================
   IDs — igual que la versión original: strings generados en el
   navegador (por ejemplo "i" + Date.now()). No se usan UUIDs para
   que las tablas hijas sigan siendo simples de leer en Supabase.
   ============================================================ */
export const genId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

/* ============================================================
   MAPEOS fila (snake_case en Supabase) <-> objeto de la app (camelCase)
   ============================================================ */

const rowToItem = (r) => ({ id: r.id, desc: r.description || "", unit: r.unit || "", qty: Number(r.qty) || 0, pu: Number(r.pu) || 0 });
const itemToRow = (it, projectId) => ({
  project_id: projectId,
  id: it.id,
  description: it.desc || "",
  unit: it.unit || "",
  qty: Number(it.qty) || 0,
  pu: Number(it.pu) || 0,
});

const rowToExecution = (r) => ({ id: r.id, date: r.date, itemId: r.item_id, qty: Number(r.qty) || 0 });
const executionToRow = (ex, projectId) => ({
  id: ex.id || genId("ex"),
  project_id: projectId,
  item_id: ex.itemId,
  date: ex.date || null,
  qty: Number(ex.qty) || 0,
});

const rowToIncome = (r) => ({ id: r.id, type: r.type, amount: Number(r.amount) || 0, date: r.date, doc: r.doc || "", desc: r.description || "" });
const incomeToRow = (i, projectId) => ({
  id: i.id || genId("i"),
  project_id: projectId,
  type: i.type,
  amount: Number(i.amount) || 0,
  date: i.date || null,
  doc: i.doc || "",
  description: i.desc || "",
});

const rowToExpense = (r) => ({
  id: r.id,
  category: r.category,
  amount: Number(r.amount) || 0,
  date: r.date,
  doc: r.doc || "",
  docType: r.doc_type || "",
  provider: r.provider || "",
  pay: r.pay || "",
  desc: r.description || "",
});
const expenseToRow = (e, projectId) => ({
  id: e.id || genId("e"),
  project_id: projectId,
  category: e.category,
  amount: Number(e.amount) || 0,
  date: e.date || null,
  doc: e.doc || "",
  doc_type: e.docType || "",
  provider: e.provider || "",
  pay: e.pay || "",
  description: e.desc || "",
});

const rowToMaterial = (r) => ({
  id: r.id,
  date: r.date,
  material: r.material,
  unit: r.unit || "",
  qty: Number(r.qty) || 0,
  itemId: r.item_id,
  pu: Number(r.pu) || 0,
  pay: r.pay || "",
  provider: r.provider || "",
});
const materialToRow = (m, projectId) => ({
  id: m.id || genId("m"),
  project_id: projectId,
  date: m.date || null,
  material: m.material,
  unit: m.unit || "",
  qty: Number(m.qty) || 0,
  item_id: m.itemId,
  pu: Number(m.pu) || 0,
  pay: m.pay || "",
  provider: m.provider || "",
});

const rowToLabor = (r) => ({
  id: r.id,
  payType: r.pay_type || "jornal",
  date: r.date,
  worker: r.worker,
  category: r.category,
  shift: r.shift || "",
  hours: Number(r.hours) || 0,
  wage: Number(r.wage) || 0,
  month: r.month || "",
  monthlySalary: Number(r.monthly_salary) || 0,
  daysWorked: Number(r.days_worked) || 0,
});
const laborToRow = (l, projectId) => ({
  id: l.id || genId("l"),
  project_id: projectId,
  pay_type: l.payType || "jornal",
  date: l.date || null,
  worker: l.worker,
  category: l.category,
  shift: l.shift || "",
  hours: Number(l.hours) || 0,
  wage: Number(l.wage) || 0,
  month: l.month || "",
  monthly_salary: Number(l.monthlySalary) || 0,
  days_worked: Number(l.daysWorked) || 0,
});

const rowToMachine = (r) => ({
  id: r.id,
  date: r.date,
  machine: r.machine,
  itemId: r.item_id,
  shift: r.shift || "",
  horIni: r.hor_ini === null || r.hor_ini === undefined ? "" : Number(r.hor_ini),
  horFin: r.hor_fin === null || r.hor_fin === undefined ? "" : Number(r.hor_fin),
  hours: Number(r.hours) || 0,
  rate: Number(r.rate) || 0,
});
const machineToRow = (m, projectId) => ({
  id: m.id || genId("mq"),
  project_id: projectId,
  date: m.date || null,
  machine: m.machine,
  item_id: m.itemId,
  shift: m.shift || "",
  hor_ini: m.horIni === "" || m.horIni === undefined ? null : Number(m.horIni),
  hor_fin: m.horFin === "" || m.horFin === undefined ? null : Number(m.horFin),
  hours: Number(m.hours) || 0,
  rate: Number(m.rate) || 0,
});

const rowToOperating = (r) => ({ id: r.id, date: r.date, category: r.category, amount: Number(r.amount) || 0, desc: r.description || "" });
const operatingToRow = (o, projectId) => ({
  id: o.id || genId("o"),
  project_id: projectId,
  date: o.date || null,
  category: o.category,
  amount: Number(o.amount) || 0,
  description: o.desc || "",
});

const rowToSchedule = (r) => ({ id: r.id, date: r.date, plannedPct: Number(r.planned_pct) || 0 });
const scheduleToRow = (s, projectId) => ({
  id: s.id || genId("s"),
  project_id: projectId,
  date: s.date || null,
  planned_pct: Number(s.plannedPct) || 0,
});

const rowToProject = (r) => ({
  id: r.id,
  name: r.name,
  code: r.code || "",
  client: r.client || "",
  location: r.location || "",
  start: r.start_date || "",
  end: r.end_date || "",
  budget: Number(r.budget) || 0,
  resident: r.resident || "",
  residentUserId: r.resident_user_id || "",
  status: r.status || "En ejecución",
  items: (r.items || []).map(rowToItem),
  executions: (r.executions || []).map(rowToExecution),
  income: (r.income || []).map(rowToIncome),
  expenses: (r.expenses || []).map(rowToExpense),
  materials: (r.materials || []).map(rowToMaterial),
  laborDaily: (r.labor_daily || []).map(rowToLabor),
  machinery: (r.machinery || []).map(rowToMachine),
  operating: (r.operating || []).map(rowToOperating),
  schedule: (r.schedule || []).map(rowToSchedule),
});

const projectHeaderToRow = (p) => ({
  id: p.id,
  name: p.name,
  code: p.code || "",
  client: p.client || "",
  location: p.location || "",
  start_date: p.start || null,
  end_date: p.end || null,
  budget: Number(p.budget) || 0,
  resident: p.resident || "",
  resident_user_id: p.residentUserId || null,
  status: p.status || "En ejecución",
});

/* ============================================================
   CARGA DE DATOS
   ============================================================ */

const NESTED_SELECT = `
  *,
  items(*),
  executions(*),
  income(*),
  expenses(*),
  materials(*),
  labor_daily(*),
  machinery(*),
  operating(*),
  schedule(*)
`;

export async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(NESTED_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToProject);
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    email: r.email || "",
    fullName: r.full_name || "",
    role: r.role === "admin" ? "Administrador" : "Residente",
  }));
}

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    email: data.email || "",
    fullName: data.full_name || "",
    role: data.role === "admin" ? "Administrador" : "Residente",
  };
}

export async function fetchRecentActivity(limit = 30) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    msg: r.message,
    time: new Date(r.created_at).toLocaleString("es-BO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
  }));
}

/* ============================================================
   PROYECTO: crear / editar cabecera
   ============================================================ */

export async function createProject(form) {
  const id = genId("p");
  const appProject = {
    id,
    name: form.name,
    code: form.code || "OBR-NUEVO",
    client: form.client || "",
    location: form.location || "",
    start: form.start || new Date().toISOString().slice(0, 10),
    end: form.end || "",
    budget: Number(form.budget) || 0,
    resident: form.resident || "Sin asignar",
    residentUserId: form.residentUserId || "",
    status: form.status || "En ejecución",
  };
  const row = projectHeaderToRow(appProject);
  const { error } = await supabase.from("projects").insert(row);
  if (error) throw error;
  return appProject;
}

export async function updateProjectHeader(id, form) {
  const row = projectHeaderToRow({ id, ...form, budget: Number(form.budget) || 0 });
  delete row.id;
  const { error } = await supabase.from("projects").update(row).eq("id", id);
  if (error) throw error;
}

/* ============================================================
   SINCRONIZACIÓN de las listas hijas de un proyecto
   Estrategia simple: se borran las filas que ya no están en la
   lista nueva y se guardan (upsert) todas las filas presentes.
   ============================================================ */

async function syncChildTable({ table, projectId, oldList, newList, toRow, onConflict = "id" }) {
  const oldIds = new Set((oldList || []).map((x) => x.id).filter(Boolean));
  const newIds = new Set((newList || []).map((x) => x.id).filter(Boolean));
  const toDelete = [...oldIds].filter((id) => !newIds.has(id));

  if (toDelete.length) {
    const { error } = await supabase.from(table).delete().in("id", toDelete);
    if (error) throw error;
  }
  if (newList && newList.length) {
    const rows = newList.map((x) => toRow(x, projectId));
    const { error } = await supabase.from(table).upsert(rows, { onConflict });
    if (error) throw error;
  }
}

async function syncItems(projectId, oldList, newList) {
  const oldIds = new Set((oldList || []).map((x) => x.id).filter(Boolean));
  const newIds = new Set((newList || []).map((x) => x.id).filter(Boolean));
  const toDelete = [...oldIds].filter((id) => !newIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from("items").delete().eq("project_id", projectId).in("id", toDelete);
    if (error) throw error;
  }
  if (newList && newList.length) {
    const rows = newList.map((x) => itemToRow(x, projectId));
    const { error } = await supabase.from("items").upsert(rows, { onConflict: "project_id,id" });
    if (error) throw error;
  }
}

// Compara el proyecto viejo con el nuevo y guarda solo lo que cambió.
// Se llama después de cada setProject(...) dentro de la vista de un proyecto.
export async function syncProjectChildren(oldProject, newProject) {
  const pid = newProject.id;
  await Promise.all([
    syncItems(pid, oldProject.items, newProject.items),
    syncChildTable({ table: "executions", projectId: pid, oldList: oldProject.executions, newList: newProject.executions, toRow: executionToRow }),
    syncChildTable({ table: "income", projectId: pid, oldList: oldProject.income, newList: newProject.income, toRow: incomeToRow }),
    syncChildTable({ table: "expenses", projectId: pid, oldList: oldProject.expenses, newList: newProject.expenses, toRow: expenseToRow }),
    syncChildTable({ table: "materials", projectId: pid, oldList: oldProject.materials, newList: newProject.materials, toRow: materialToRow }),
    syncChildTable({ table: "labor_daily", projectId: pid, oldList: oldProject.laborDaily, newList: newProject.laborDaily, toRow: laborToRow }),
    syncChildTable({ table: "machinery", projectId: pid, oldList: oldProject.machinery, newList: newProject.machinery, toRow: machineToRow }),
    syncChildTable({ table: "operating", projectId: pid, oldList: oldProject.operating, newList: newProject.operating, toRow: operatingToRow }),
    syncChildTable({ table: "schedule", projectId: pid, oldList: oldProject.schedule, newList: newProject.schedule, toRow: scheduleToRow }),
  ]);

  const headerChanged =
    oldProject.name !== newProject.name ||
    oldProject.code !== newProject.code ||
    oldProject.client !== newProject.client ||
    oldProject.location !== newProject.location ||
    oldProject.start !== newProject.start ||
    oldProject.end !== newProject.end ||
    oldProject.budget !== newProject.budget ||
    oldProject.resident !== newProject.resident ||
    oldProject.residentUserId !== newProject.residentUserId ||
    oldProject.status !== newProject.status;

  if (headerChanged) {
    await updateProjectHeader(newProject.id, newProject);
  }
}

/* ============================================================
   ACTIVIDAD (notificaciones para el administrador)
   ============================================================ */

export async function logActivity(message, projectId, userId) {
  const row = { id: genId("log"), message, project_id: projectId || null, created_by: userId || null };
  const { error } = await supabase.from("activity_log").insert(row);
  if (error) throw error;
}

/* ============================================================
   USUARIOS — creación desde dentro de la aplicación
   ============================================================ */

// Crea un usuario nuevo (login) usando un cliente secundario que no toca
// la sesión del administrador, y guarda su perfil (nombre + rol).
export async function createUser({ email, password, fullName, role }) {
  const { data, error } = await supabaseSecondary.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error(
      "No se pudo obtener el usuario recién creado. Revisa que el correo no esté ya registrado."
    );
  }
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: role === "Administrador" ? "admin" : "residente",
  });
  if (profileError) throw profileError;
  return userId;
}

export async function updateUserRole(userId, role, fullName) {
  const { error } = await supabase
    .from("profiles")
    .update({ role: role === "Administrador" ? "admin" : "residente", full_name: fullName })
    .eq("id", userId);
  if (error) throw error;
}
