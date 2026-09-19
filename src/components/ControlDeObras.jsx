import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Building2,
  LayoutGrid,
  Users,
  Plus,
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  HardHat,
  Truck,
  Wrench,
  FileDown,
  Search,
  X,
  MapPin,
  Calendar,
  ChevronRight,
  BadgeCheck,
  PauseCircle,
  Hammer,
  Pencil,
  FileSpreadsheet,
  Trash2,
  Bell,
  Monitor,
  Smartphone,
  WifiOff,
  CalendarRange,
  LogOut,
} from "lucide-react";
import { genId } from "../lib/api.js";
import { money, num2, expenseCategories } from "../lib/format.js";
import { REPORTS, exportReportToPDF, exportReportToExcel } from "../lib/reports.js";
import UsersView from "./UsersView.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/* ============================================================
   PALETA / TOKENS
   Base:   #F6F5F2 (fondo)  #FFFFFF (superficies)
   Tinta:  #1B2A3C (azul plano / "blueprint")
   Acento: #E08A2C (naranja obra)
   Éxito:  #2F6F52 (avance / positivo)
   Alerta: #B3402F (atraso / negativo)
   Línea:  #E3E1DB
   ============================================================ */

// money(), num2() y expenseCategories ahora viven en ../lib/format.js
// (se importan arriba) para poder reutilizarlos también desde
// ../lib/reports.js sin crear un import circular.

// --- Ayudantes de fechas para el selector de periodo de Reportes (fechas guardadas como "AAAA-MM-DD") ---
function monthToRange(monthStr) {
  if (!monthStr) return null;
  const [y, m] = monthStr.split("-").map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}
function isoWeekToRange(weekStr) {
  if (!weekStr) return null;
  const [yearStr, weekPart] = weekStr.split("-W");
  const year = Number(yearStr);
  const week = Number(weekPart);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay() || 7;
  const monday = new Date(simple);
  monday.setDate(simple.getDate() - dow + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

/* ---------------------------------------------------------
   (Los proyectos de ejemplo se eliminaron: los datos reales
   ahora vienen de Supabase — ver src/lib/api.js)
--------------------------------------------------------- */
/*
const initialProjects_UNUSED = [
  {
    id: "p1",
    name: "Edificio Girasoles",
    code: "OBR-2026-01",
    client: "Inmobiliaria Andina S.R.L.",
    location: "Sucre, Chuquisaca",
    start: "2026-03-10",
    end: "2026-12-20",
    budget: 4200000,
    resident: "Marcelo Rojas",
    status: "En ejecución",
    items: [
      { id: "1.1", desc: "Enlosetado cerámico", unit: "m²", qty: 1000, pu: 120 },
      { id: "1.2", desc: "Muro de ladrillo 6h", unit: "m²", qty: 850, pu: 95 },
      { id: "2.1", desc: "Losa de hormigón armado", unit: "m³", qty: 220, pu: 1450 },
      { id: "2.2", desc: "Instalación sanitaria", unit: "pto", qty: 64, pu: 310 },
      { id: "3.1", desc: "Revoque exterior", unit: "m²", qty: 1200, pu: 68 },
    ],
    executions: [
      { date: "2026-09-10", itemId: "1.1", qty: 35 },
      { date: "2026-09-11", itemId: "1.1", qty: 42 },
      { date: "2026-09-11", itemId: "1.2", qty: 60 },
      { date: "2026-09-12", itemId: "2.1", qty: 8 },
      { date: "2026-09-13", itemId: "1.1", qty: 30 },
      { date: "2026-09-13", itemId: "3.1", qty: 90 },
    ],
    income: [
      { id: "i1", type: "Anticipo", amount: 800000, date: "2026-03-15", doc: "FAC-001", desc: "Anticipo de obra" },
      { id: "i2", type: "Planilla 1", amount: 350000, date: "2026-05-02", doc: "FAC-014", desc: "Avance de obra mes 1" },
      { id: "i3", type: "Planilla 2", amount: 410000, date: "2026-06-04", doc: "FAC-021", desc: "Avance de obra mes 2" },
      { id: "i4", type: "Préstamo", amount: 150000, date: "2026-07-01", doc: "—", desc: "Capital de trabajo" },
    ],
    expenses: [
      { id: "e1", category: "Materiales", amount: 210000, date: "2026-09-08", doc: "FC-3321", provider: "Ferretería Central", pay: "Contado", desc: "Cemento y arena" },
      { id: "e2", category: "Mano de Obra", amount: 96000, date: "2026-09-13", doc: "—", provider: "Planilla semanal", pay: "Pagado", desc: "Jornales semana 37" },
      { id: "e3", category: "Maquinaria", amount: 54000, date: "2026-09-09", doc: "FC-889", provider: "Alquileres Sucre", pay: "Fiado", desc: "Mezcladora 5 días" },
      { id: "e4", category: "Gastos de Operación", amount: 12500, date: "2026-09-05", doc: "REC-102", provider: "Copisur", pay: "Contado", desc: "Papelería y planos" },
      { id: "e5", category: "Materiales", amount: 88000, date: "2026-09-12", doc: "FC-3355", provider: "Cerámica Bolivia", pay: "Fiado", desc: "Cerámica enlosetado" },
    ],
    materials: [
      { id: "m1", date: "2026-09-13", material: "Cemento", unit: "Bolsa", qty: 20, itemId: "1.1", pu: 65, pay: "Fiado", provider: "Ferretería XYZ" },
      { id: "m2", date: "2026-09-12", material: "Cerámica 45x45", unit: "m²", qty: 40, itemId: "1.1", pu: 78, pay: "Contado", provider: "Cerámica Bolivia" },
      { id: "m3", date: "2026-09-11", material: "Ladrillo 6h", unit: "Pza", qty: 1200, itemId: "1.2", pu: 1.8, pay: "Fiado", provider: "Ladrillera Sur" },
    ],
    laborDaily: [
      { id: "l1", date: "2026-09-13", worker: "Juan Quispe", category: "Albañil", hours: 8, wage: 130 },
      { id: "l2", date: "2026-09-13", worker: "Pedro Mamani", category: "Ayudante", hours: 8, wage: 90 },
      { id: "l3", date: "2026-09-12", worker: "Juan Quispe", category: "Albañil", hours: 7.5, wage: 130 },
    ],
    machinery: [
      { id: "mq1", date: "2026-09-09", machine: "Mezcladora", itemId: "2.1", hours: 6, rate: 45 },
      { id: "mq2", date: "2026-09-11", machine: "Volqueta", itemId: "1.2", hours: 3, rate: 120 },
    ],
    operating: [
      { id: "o1", date: "2026-09-05", category: "Papelería", amount: 1200, desc: "Copias de planos" },
      { id: "o2", date: "2026-09-07", category: "Transporte", amount: 3400, desc: "Combustible camioneta" },
    ],
    schedule: [
      { id: "s1", date: "2026-09-08", plannedPct: 12 },
      { id: "s2", date: "2026-09-15", plannedPct: 24 },
      { id: "s3", date: "2026-09-22", plannedPct: 38 },
      { id: "s4", date: "2026-09-29", plannedPct: 50 },
    ],
  },
  {
    id: "p2",
    name: "Vivienda Familiar Recoleta",
    code: "OBR-2026-02",
    client: "Fam. Torrico Vargas",
    location: "Sucre, Chuquisaca",
    start: "2026-06-01",
    end: "2026-11-15",
    budget: 950000,
    resident: "Ana Colque",
    status: "En ejecución",
    items: [{ id: "1.1", desc: "Cimientos", unit: "m³", qty: 40, pu: 900 }],
    executions: [{ date: "2026-09-10", itemId: "1.1", qty: 12 }],
    income: [{ id: "i1", type: "Anticipo", amount: 300000, date: "2026-06-05", doc: "FAC-002", desc: "Anticipo" }],
    expenses: [{ id: "e1", category: "Materiales", amount: 45000, date: "2026-09-01", doc: "FC-90", provider: "Ferretería Central", pay: "Contado", desc: "Fierro y cemento" }],
    materials: [],
    laborDaily: [],
    machinery: [],
    operating: [],
    schedule: [],
  },
  {
    id: "p3",
    name: "Ampliación Colegio San Marcos",
    code: "OBR-2025-11",
    client: "Junta Escolar San Marcos",
    location: "Yotala, Chuquisaca",
    start: "2025-11-01",
    end: "2026-04-30",
    budget: 1600000,
    resident: "Marcelo Rojas",
    status: "Terminado",
    items: [],
    executions: [],
    income: [{ id: "i1", type: "Planilla 1", amount: 1600000, date: "2026-04-25", doc: "FAC-500", desc: "Pago final" }],
    expenses: [{ id: "e1", category: "Materiales", amount: 900000, date: "2026-03-01", doc: "FC-11", provider: "Varios", pay: "Contado", desc: "Materiales generales" }],
    materials: [],
    laborDaily: [],
    machinery: [],
    operating: [],
    schedule: [],
  },
];
*/

const statusStyle = {
  "En ejecución": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-700" },
  Terminado: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-600" },
  Paralizado: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-700" },
};

const incomeTypesDefault = [
  "Anticipo",
  "Préstamo",
  "Planilla 1",
  "Planilla 2",
  "Planilla 3",
  "Planilla 4",
  "Planilla 5",
  "Planilla 6",
  "Planilla 7",
  "Planilla 8",
  "Planilla 9",
  "Planilla 10",
  "Otros ingresos",
];
const docTypes = ["Con factura", "Sin factura", "Con recibo"];
const shifts = ["Mañana", "Tarde", "Noche"];

// Un color de acento distinto por módulo de Control Físico, para diferenciarlos de un vistazo
const moduleColors = {
  items: "bg-slate-800 hover:bg-slate-700 text-white",
  ejecucion: "bg-orange-500 hover:bg-orange-600 text-white",
  materiales: "bg-amber-600 hover:bg-amber-700 text-white",
  manoObra: "bg-blue-600 hover:bg-blue-800 text-white",
  maquinaria: "bg-teal-600 hover:bg-teal-800 text-white",
  operacion: "bg-violet-600 hover:bg-violet-700 text-white",
};
const moduleSoft = {
  items: "bg-slate-100 text-slate-800",
  ejecucion: "bg-amber-50 text-amber-700",
  materiales: "bg-amber-50 text-amber-800",
  manoObra: "bg-blue-50 text-blue-700",
  maquinaria: "bg-teal-50 text-teal-700",
  operacion: "bg-violet-50 text-violet-700",
};

/* ---------------------------------------------------------
   PIEZAS PEQUEÑAS DE UI
--------------------------------------------------------- */

function KpiCard({ label, value, sub, tone = "default", icon: Icon }) {
  const toneMap = {
    default: "text-slate-800",
    good: "text-emerald-700",
    bad: "text-red-700",
    accent: "text-orange-600",
  };
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-1 min-w-36">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {Icon && <Icon size={16} className="text-gray-400" />}
      </div>
      <span className={`text-xl font-semibold ${toneMap[tone]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

function PillButton({ children, onClick, variant = "primary", className, type = "button" }) {
  const styles =
    variant === "primary"
      ? "bg-slate-800 text-white hover:bg-slate-700"
      : variant === "accent"
      ? "bg-orange-500 text-white hover:bg-orange-600"
      : variant === "good"
      ? "bg-emerald-700 text-white hover:bg-emerald-800"
      : variant === "bad"
      ? "bg-red-700 text-white hover:bg-red-800"
      : "bg-white text-slate-800 border border-stone-300 hover:bg-stone-100";
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${className || styles}`}
    >
      {children}
    </button>
  );
}

function IconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md border border-stone-300 text-gray-500 hover:bg-stone-100 hover:text-slate-800 transition-colors"
    >
      {children}
    </button>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1.5">
      <IconButton title="Editar" onClick={onEdit}>
        <Pencil size={13} />
      </IconButton>
      <IconButton title="Eliminar" onClick={onDelete}>
        <Trash2 size={13} className="text-red-600" />
      </IconButton>
    </div>
  );
}

function confirmDelete(label) {
  return typeof window !== "undefined" ? window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`) : true;
}

// El diálogo nativo window.confirm() queda bloqueado en el entorno de vista previa (nunca se ve
// y siempre "cancela" en silencio) — por eso "Eliminar" no funcionaba. Este modal propio lo reemplaza.
function useDeleteConfirm() {
  const [pending, setPending] = useState(null); // { message, onConfirm }
  const ask = (message, onConfirm) => setPending({ message, onConfirm });
  const modal = pending && (
    <Modal title="Confirmar eliminación" onClose={() => setPending(null)}>
      <p className="text-sm text-gray-600">{pending.message}</p>
      <div className="flex gap-2 justify-end">
        <PillButton variant="ghost" onClick={() => setPending(null)}>
          Cancelar
        </PillButton>
        <PillButton
          variant="bad"
          onClick={() => {
            pending.onConfirm();
            setPending(null);
          }}
        >
          Sí, eliminar
        </PillButton>
      </div>
    </Modal>
  );
  return [ask, modal];
}

function CategoryTotalFilter({ label, value, onChange, options, total, count }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3.5 flex flex-wrap items-center gap-3">
      <Field label={label}>
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="Todos">Todos</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
      {value !== "Todos" && (
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-400">Total en "{value}" ({count} registro{count === 1 ? "" : "s"})</p>
          <p className="text-lg font-semibold text-slate-800">{money(total)}</p>
        </div>
      )}
    </div>
  );
}

function Table({ columns, rows, emptyLabel = "Sin registros todavía." }) {
  if (!rows.length) {
    return (
      <div className="text-center py-10 text-sm text-slate-400 bg-stone-50 rounded-lg border border-dashed border-stone-200">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-100 text-gray-500 text-left">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-stone-200 hover:bg-stone-50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-slate-800 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-800/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-y-auto shadow-xl" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "border border-stone-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800";

/* ---------------------------------------------------------
   LISTA DE PROYECTOS
--------------------------------------------------------- */

const blankProjectForm = {
  name: "",
  code: "",
  client: "",
  location: "",
  budget: "",
  start: "",
  end: "",
  resident: "",
  residentUserId: "",
  status: "En ejecución",
};

function ProjectFormFields({ form, setForm, residentOptions = [] }) {
  return (
    <>
      <Field label="Nombre del proyecto">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Código">
        <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      </Field>
      <Field label="Cliente">
        <input className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
      </Field>
      <Field label="Ubicación">
        <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de inicio">
          <input type="date" className={inputCls} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
        </Field>
        <Field label="Fecha prevista de fin">
          <input type="date" className={inputCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </Field>
      </div>
      <Field label="Presupuesto contratado (Bs)">
        <input type="number" className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
      </Field>
      {residentOptions.length > 0 && (
        <Field label="Usuario residente (opcional — le permite iniciar sesión y ver este proyecto)">
          <select
            className={inputCls}
            value={form.residentUserId || ""}
            onChange={(e) => {
              const uid = e.target.value;
              const picked = residentOptions.find((r) => r.id === uid);
              setForm({ ...form, residentUserId: uid, resident: picked ? picked.fullName : form.resident });
            }}
          >
            <option value="">— Sin usuario vinculado —</option>
            {residentOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName || r.email}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Nombre del residente (texto libre)">
        <input className={inputCls} value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} />
      </Field>
      <Field label="Estado">
        <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {["En ejecución", "Terminado", "Paralizado"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
    </>
  );
}

function ProjectsView({ projects, onOpen, onCreate, onEdit, role, residentOptions = [] }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(blankProjectForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blankProjectForm);

  const openEdit = (p) => {
    setEditForm({
      name: p.name,
      code: p.code,
      client: p.client,
      location: p.location,
      budget: p.budget,
      start: p.start,
      end: p.end,
      resident: p.resident,
      residentUserId: p.residentUserId || "",
      status: p.status,
    });
    setEditingId(p.id);
  };

  return (
    <div>
      <SectionHeader
        title="Proyectos"
        action={
          role === "Administrador" && (
            <PillButton variant="accent" onClick={() => setShowNew(true)}>
              <Plus size={15} /> Nuevo proyecto
            </PillButton>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => {
          const ingresos = p.income.reduce((a, b) => a + b.amount, 0);
          const egresos = p.expenses.reduce((a, b) => a + b.amount, 0);
          const st = statusStyle[p.status];
          return (
            <div
              key={p.id}
              className="text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-slate-800 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <button onClick={() => onOpen(p.id)} className="text-left">
                  <p className="text-xs text-slate-400 font-medium">{p.code}</p>
                  <p className="text-base font-semibold text-slate-800">{p.name}</p>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.text} flex items-center gap-1 whitespace-nowrap`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {p.status}
                  </span>
                  {role === "Administrador" && (
                    <IconButton title="Editar proyecto" onClick={() => openEdit(p)}>
                      <Pencil size={13} />
                    </IconButton>
                  )}
                </div>
              </div>
              <button onClick={() => onOpen(p.id)} className="text-left flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={13} className="text-orange-600" /> {p.location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={13} className="text-blue-700" /> {p.start} → {p.end}
                </div>
                <div className="h-px bg-stone-200" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Presupuesto</p>
                    <p className="text-sm font-medium text-slate-800">{money(p.budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Ingresos</p>
                    <p className="text-sm font-medium text-emerald-700">{money(ingresos)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Egresos</p>
                    <p className="text-sm font-medium text-red-700">{money(egresos)}</p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {showNew && (
        <Modal title="Nuevo proyecto" onClose={() => setShowNew(false)}>
          <ProjectFormFields form={form} setForm={setForm} residentOptions={residentOptions} />
          <PillButton
            variant="accent"
            onClick={() => {
              if (!form.name) return;
              onCreate(form);
              setShowNew(false);
              setForm(blankProjectForm);
            }}
          >
            Crear proyecto
          </PillButton>
        </Modal>
      )}

      {editingId && (
        <Modal title="Editar proyecto" onClose={() => setEditingId(null)}>
          <ProjectFormFields form={editForm} setForm={setEditForm} residentOptions={residentOptions} />
          <PillButton
            variant="accent"
            onClick={() => {
              onEdit(editingId, editForm);
              setEditingId(null);
            }}
          >
            Guardar cambios
          </PillButton>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   RESUMEN
--------------------------------------------------------- */

function ResumenTab({ project, setProject }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: "", plannedPct: "" });

  const ingresos = project.income.reduce((a, b) => a + b.amount, 0);
  const egresos = project.expenses.reduce((a, b) => a + b.amount, 0);
  const saldo = ingresos - egresos;

  const itemsTotal = project.items.reduce((a, it) => a + it.qty * it.pu, 0);
  const execByItem = {};
  project.executions.forEach((ex) => {
    execByItem[ex.itemId] = (execByItem[ex.itemId] || 0) + ex.qty;
  });
  const executedValue = project.items.reduce((a, it) => a + (execByItem[it.id] || 0) * it.pu, 0);
  const avanceFisico = itemsTotal ? (executedValue / itemsTotal) * 100 : 0;
  const avanceFinanciero = project.budget ? (egresos / project.budget) * 100 : 0;

  const schedule = project.schedule || [];
  const scheduleSorted = schedule.slice().sort((a, b) => (a.date < b.date ? -1 : 1));

  const addSchedulePoint = () => {
    if (!scheduleForm.date || scheduleForm.plannedPct === "") return;
    setProject({
      ...project,
      schedule: [...schedule, { id: "s" + Date.now(), date: scheduleForm.date, plannedPct: Number(scheduleForm.plannedPct) }],
    });
    setScheduleForm({ date: "", plannedPct: "" });
  };
  const deleteSchedulePoint = (id) => {
    setProject({ ...project, schedule: schedule.filter((s) => s.id !== id) });
  };

  // Curva S: si hay programación cargada, se usa esa; si no, se simula para tener algo que mostrar.
  const curva = useMemo(() => {
    if (scheduleSorted.length > 0) {
      return scheduleSorted.map((s) => {
        const execUpTo = project.executions.filter((ex) => ex.date <= s.date);
        const execValue = execUpTo.reduce((acc, ex) => {
          const it = project.items.find((i) => i.id === ex.itemId);
          return acc + ex.qty * (it?.pu || 0);
        }, 0);
        const execPct = itemsTotal ? Math.min(100, (execValue / itemsTotal) * 100) : 0;
        return { semana: s.date, Programado: Number(s.plannedPct), Ejecutado: Number(execPct.toFixed(2)) };
      });
    }
    const days = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
    const progStep = 100 / days.length;
    return days.map((d, i) => {
      const acumProg = Math.min(100, progStep * (i + 1));
      const acumEjec = Math.min(100, avanceFisico * ((i + 1) / days.length) * (0.7 + 0.05 * i));
      return { semana: d, Programado: Number(acumProg.toFixed(2)), Ejecutado: Number(acumEjec.toFixed(2)) };
    });
  }, [scheduleSorted, avanceFisico, project.executions, project.items, itemsTotal]);

  const porCategoria = expenseCategories.map((cat) => ({
    categoria: cat.replace(" de Operación", ""),
    monto: project.expenses.filter((e) => e.category === cat).reduce((a, b) => a + b.amount, 0),
  }));

  const diff = curva[curva.length - 1].Ejecutado - curva[curva.length - 1].Programado;
  const estado = diff >= 5 ? "Adelantada" : diff <= -5 ? "Atrasada" : "En línea";
  const estadoTone = diff >= 5 ? "good" : diff <= -5 ? "bad" : "accent";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Presupuesto contratado" value={money(project.budget)} icon={Wallet} />
        <KpiCard label="Ingresos totales" value={money(ingresos)} tone="good" icon={TrendingUp} />
        <KpiCard label="Egresos totales" value={money(egresos)} tone="bad" icon={TrendingDown} />
        <KpiCard label="Saldo disponible" value={money(saldo)} tone={saldo >= 0 ? "good" : "bad"} icon={Wallet} />
        <KpiCard label="Avance físico" value={`${num2(avanceFisico)}%`} sub={`${money(executedValue)} ejecutado`} />
        <KpiCard label="Avance financiero" value={`${num2(avanceFinanciero)}%`} sub="sobre presupuesto" />
        <KpiCard label="Costo ejecutado" value={money(executedValue)} />
        <KpiCard label="Saldo por ejecutar" value={money(Math.max(itemsTotal - executedValue, 0))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm font-medium text-slate-800">Curva S — Programado vs. Ejecutado</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  estadoTone === "good" ? "bg-emerald-50 text-emerald-700" : estadoTone === "bad" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                Obra {estado}
              </span>
              <PillButton variant="ghost" onClick={() => setShowSchedule(true)}>
                <CalendarRange size={14} /> Programación
              </PillButton>
            </div>
          </div>
          {scheduleSorted.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2">
              Todavía no cargaste la programación de obra — esta curva es una simulación de referencia. Toca "Programación" para ingresar tus propios datos.
            </p>
          )}
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={curva} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="#EDECE6" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 12, fill: "#9AA0AA" }} axisLine={{ stroke: "#E3E1DB" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9AA0AA" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v) => `${num2(v)}%`} contentStyle={{ borderRadius: 8, borderColor: "#E3E1DB", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Programado" stroke="#9AA0AA" strokeWidth={2} dot={false} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="Ejecutado" stroke="#E08A2C" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-sm font-medium text-slate-800 mb-2">Egresos por categoría</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={porCategoria} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid stroke="#EDECE6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9AA0AA" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="categoria" type="category" width={90} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 8, borderColor: "#E3E1DB", fontSize: 12 }} />
              <Bar dataKey="monto" fill="#1B2A3C" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showSchedule && (
        <Modal title="Programación de obra (Curva S)" onClose={() => setShowSchedule(false)}>
          <p className="text-xs text-gray-500 leading-relaxed">
            Ingresa el <b>% de avance acumulado programado</b> para cada fecha de control. El "Ejecutado" se calcula solo, a partir de las ejecuciones
            reales registradas hasta esa fecha.
          </p>
          <Table
            columns={["Fecha", "% programado", ""]}
            rows={scheduleSorted.map((s) => [
              s.date,
              `${num2(s.plannedPct)}%`,
              <IconButton key={s.id} title="Eliminar" onClick={() => deleteSchedulePoint(s.id)}>
                <Trash2 size={13} className="text-red-600" />
              </IconButton>,
            ])}
            emptyLabel="Todavía no hay puntos de programación."
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input type="date" className={inputCls} value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
            </Field>
            <Field label="% acumulado programado">
              <input
                type="number"
                className={inputCls}
                value={scheduleForm.plannedPct}
                onChange={(e) => setScheduleForm({ ...scheduleForm, plannedPct: e.target.value })}
              />
            </Field>
          </div>
          <PillButton variant="accent" onClick={addSchedulePoint}>
            <Plus size={15} /> Agregar punto
          </PillButton>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   CONTROL FINANCIERO
--------------------------------------------------------- */

function FinancieroTab({ project, setProject, onLog, role }) {
  const [sub, setSub] = useState("ingresos");
  const [showModal, setShowModal] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [incomeTypeFilter, setIncomeTypeFilter] = useState("Todos");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("Todos");
  const [askDelete, deleteModal] = useDeleteConfirm();

  const ingresos = project.income.reduce((a, b) => a + b.amount, 0);
  const egresos = project.expenses.reduce((a, b) => a + b.amount, 0);
  const saldo = ingresos - egresos;

  const blankIncome = { type: incomeTypesDefault[0], amount: "", date: "", doc: "", desc: "" };
  const blankExpense = { category: expenseCategories[0], amount: "", date: "", doc: "", docType: docTypes[0], provider: "", pay: "Contado", desc: "" };

  const [incomeForm, setIncomeForm] = useState(blankIncome);
  const [expenseForm, setExpenseForm] = useState(blankExpense);

  const openNewIncome = () => {
    setIncomeForm(blankIncome);
    setEditingIncomeId(null);
    setShowModal(true);
  };
  const openEditIncome = (rec) => {
    setIncomeForm({ type: rec.type, amount: rec.amount, date: rec.date, doc: rec.doc, desc: rec.desc });
    setEditingIncomeId(rec.id);
    setShowModal(true);
  };
  const saveIncome = () => {
    if (!incomeForm.amount) return;
    if (editingIncomeId) {
      setProject({
        ...project,
        income: project.income.map((i) => (i.id === editingIncomeId ? { ...i, ...incomeForm, amount: Number(incomeForm.amount) } : i)),
      });
    } else {
      setProject({ ...project, income: [...project.income, { id: "i" + Date.now(), ...incomeForm, amount: Number(incomeForm.amount) }] });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró un ingreso de ${money(incomeForm.amount)} (${incomeForm.type}) en "${project.name}".`);
    }
    setIncomeForm(blankIncome);
    setEditingIncomeId(null);
    setShowModal(false);
  };
  const deleteIncome = (id) => {
    askDelete("¿Eliminar este ingreso? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, income: project.income.filter((i) => i.id !== id) });
    });
  };

  const openNewExpense = () => {
    setExpenseForm(blankExpense);
    setEditingExpenseId(null);
    setShowModal(true);
  };
  const openEditExpense = (rec) => {
    setExpenseForm({
      category: rec.category,
      amount: rec.amount,
      date: rec.date,
      doc: rec.doc,
      docType: rec.docType || docTypes[0],
      provider: rec.provider,
      pay: rec.pay,
      desc: rec.desc,
    });
    setEditingExpenseId(rec.id);
    setShowModal(true);
  };
  const saveExpense = () => {
    if (!expenseForm.amount) return;
    if (editingExpenseId) {
      setProject({
        ...project,
        expenses: project.expenses.map((e) => (e.id === editingExpenseId ? { ...e, ...expenseForm, amount: Number(expenseForm.amount) } : e)),
      });
    } else {
      setProject({ ...project, expenses: [...project.expenses, { id: "e" + Date.now(), ...expenseForm, amount: Number(expenseForm.amount) }] });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró un egreso de ${money(expenseForm.amount)} (${expenseForm.category}) en "${project.name}".`);
    }
    setExpenseForm(blankExpense);
    setEditingExpenseId(null);
    setShowModal(false);
  };
  const deleteExpense = (id) => {
    askDelete("¿Eliminar este egreso? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, expenses: project.expenses.filter((e) => e.id !== id) });
    });
  };

  const incomeList = (incomeTypeFilter === "Todos" ? project.income : project.income.filter((i) => i.type === incomeTypeFilter)).slice().reverse();
  const expenseList = (expenseCategoryFilter === "Todos" ? project.expenses : project.expenses.filter((e) => e.category === expenseCategoryFilter))
    .slice()
    .reverse();
  const incomeFilterTotal = incomeList.reduce((a, b) => a + b.amount, 0);
  const expenseFilterTotal = expenseList.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Ingresos totales" value={money(ingresos)} tone="good" icon={TrendingUp} />
        <KpiCard label="Egresos totales" value={money(egresos)} tone="bad" icon={TrendingDown} />
        <KpiCard label="Saldo disponible" value={money(saldo)} tone={saldo >= 0 ? "good" : "bad"} icon={Wallet} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex bg-stone-200 rounded-lg p-1 w-fit">
          {["ingresos", "egresos"].map((s) => (
            <button
              key={s}
              onClick={() => setSub(s)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                sub === s ? (s === "ingresos" ? "bg-emerald-700 text-white shadow-sm" : "bg-red-700 text-white shadow-sm") : "text-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <PillButton variant={sub === "ingresos" ? "good" : "bad"} onClick={sub === "ingresos" ? openNewIncome : openNewExpense}>
          <Plus size={15} /> Registrar {sub === "ingresos" ? "ingreso" : "egreso"}
        </PillButton>
      </div>

      {sub === "ingresos" ? (
        <>
          <CategoryTotalFilter
            label="Filtrar por tipo de ingreso"
            value={incomeTypeFilter}
            onChange={setIncomeTypeFilter}
            options={incomeTypesDefault}
            total={incomeFilterTotal}
            count={incomeList.length}
          />
          <Table
            columns={["Fecha", "Tipo", "Monto", "Comprobante", "Descripción", "Acciones"]}
            rows={incomeList.map((i) => [
              i.date,
              i.type,
              money(i.amount),
              i.doc,
              i.desc,
              <RowActions key={i.id} onEdit={() => openEditIncome(i)} onDelete={() => deleteIncome(i.id)} />,
            ])}
          />
        </>
      ) : (
        <>
          <CategoryTotalFilter
            label="Filtrar por categoría de egreso"
            value={expenseCategoryFilter}
            onChange={setExpenseCategoryFilter}
            options={expenseCategories}
            total={expenseFilterTotal}
            count={expenseList.length}
          />
          <Table
            columns={["Fecha", "Categoría", "Monto", "Proveedor", "Forma de pago", "Comprobante", "Tipo comprobante", "Descripción", "Acciones"]}
            rows={expenseList.map((e) => [
              e.date,
              e.category,
              money(e.amount),
              e.provider,
              e.pay,
              e.doc,
              e.docType || "—",
              e.desc,
              <RowActions key={e.id} onEdit={() => openEditExpense(e)} onDelete={() => deleteExpense(e.id)} />,
            ])}
          />
        </>
      )}

      {showModal &&
        (sub === "ingresos" ? (
          <Modal title={editingIncomeId ? "Editar ingreso" : "Registrar ingreso"} onClose={() => setShowModal(false)}>
            <Field label="Tipo de ingreso">
              <select className={inputCls} value={incomeForm.type} onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}>
                {incomeTypesDefault.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Monto (Bs)">
              <input type="number" className={inputCls} value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <input type="date" className={inputCls} value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            </Field>
            <Field label="N° de factura / comprobante">
              <input className={inputCls} value={incomeForm.doc} onChange={(e) => setIncomeForm({ ...incomeForm, doc: e.target.value })} />
            </Field>
            <Field label="Descripción">
              <input className={inputCls} value={incomeForm.desc} onChange={(e) => setIncomeForm({ ...incomeForm, desc: e.target.value })} />
            </Field>
            <PillButton variant="good" onClick={saveIncome}>
              {editingIncomeId ? "Guardar cambios" : "Guardar ingreso"}
            </PillButton>
          </Modal>
        ) : (
          <Modal title={editingExpenseId ? "Editar egreso" : "Registrar egreso"} onClose={() => setShowModal(false)}>
            <Field label="Categoría">
              <select className={inputCls} value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                {expenseCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Monto (Bs)">
              <input type="number" className={inputCls} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <input type="date" className={inputCls} value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </Field>
            <Field label="Proveedor / beneficiario">
              <input className={inputCls} value={expenseForm.provider} onChange={(e) => setExpenseForm({ ...expenseForm, provider: e.target.value })} />
            </Field>
            <Field label="Forma de pago">
              <select className={inputCls} value={expenseForm.pay} onChange={(e) => setExpenseForm({ ...expenseForm, pay: e.target.value })}>
                {["Contado", "Pagado", "Fiado"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de comprobante">
              <select className={inputCls} value={expenseForm.docType} onChange={(e) => setExpenseForm({ ...expenseForm, docType: e.target.value })}>
                {docTypes.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="N° de factura / comprobante">
              <input className={inputCls} value={expenseForm.doc} onChange={(e) => setExpenseForm({ ...expenseForm, doc: e.target.value })} />
            </Field>
            <Field label="Descripción">
              <input className={inputCls} value={expenseForm.desc} onChange={(e) => setExpenseForm({ ...expenseForm, desc: e.target.value })} />
            </Field>
            <PillButton variant="bad" onClick={saveExpense}>
              {editingExpenseId ? "Guardar cambios" : "Guardar egreso"}
            </PillButton>
          </Modal>
        ))}
      {deleteModal}
    </div>
  );
}

/* ---------------------------------------------------------
   CONTROL FÍSICO
--------------------------------------------------------- */

function FisicoTab({ project, setProject, onLog, role }) {
  const [sub, setSub] = useState("items");
  const [showModal, setShowModal] = useState(false);
  const [askDelete, deleteModal] = useDeleteConfirm();
  const subTabs = [
    { key: "items", label: "Ítems", icon: ClipboardList },
    { key: "ejecucion", label: "Ejecución", icon: TrendingUp },
    { key: "materiales", label: "Materiales", icon: Hammer },
    { key: "manoObra", label: "Mano de obra", icon: HardHat },
    { key: "maquinaria", label: "Maquinaria", icon: Truck },
    { key: "operacion", label: "Gastos de operación", icon: Wrench },
  ];

  const execByItem = {};
  project.executions.forEach((ex) => {
    execByItem[ex.itemId] = (execByItem[ex.itemId] || 0) + ex.qty;
  });
  // Cuánto material (Bs y cantidad) se asignó a cada ítem — vínculo con la pestaña Materiales
  const materialByItem = {};
  project.materials.forEach((m) => {
    if (!materialByItem[m.itemId]) materialByItem[m.itemId] = { qty: 0, unit: m.unit, cost: 0 };
    materialByItem[m.itemId].qty += m.qty;
    materialByItem[m.itemId].cost += m.qty * m.pu;
  });

  const blankItem = { id: "", desc: "", unit: "", qty: "", pu: "" };
  const blankExec = { date: "", itemId: project.items[0]?.id || "", qty: "" };
  const blankMat = { date: "", material: "", unit: "", qty: "", itemId: project.items[0]?.id || "", pu: "", pay: "Contado", provider: "" };
  const blankLabor = {
    payType: "jornal",
    date: "",
    worker: "",
    category: "Albañil",
    shift: shifts[0],
    hours: "",
    wage: "",
    month: "",
    monthlySalary: "",
    daysWorked: "",
  };
  const blankMachine = { date: "", machine: "", itemId: project.items[0]?.id || "", shift: shifts[0], horIni: "", horFin: "", hours: "", rate: "" };
  const blankOper = { date: "", category: "", amount: "", desc: "" };

  const [itemForm, setItemForm] = useState(blankItem);
  const [execForm, setExecForm] = useState(blankExec);
  const [matForm, setMatForm] = useState(blankMat);
  const [laborForm, setLaborForm] = useState(blankLabor);
  const [machineForm, setMachineForm] = useState(blankMachine);
  const [operForm, setOperForm] = useState(blankOper);

  // Suma de precio total de los ítems del Control Físico — vinculada con el Presupuesto Contratado
  const itemsTotal = project.items.reduce((a, it) => a + it.qty * it.pu, 0);
  const budgetDiff = (project.budget || 0) - itemsTotal;
  const budgetPct = project.budget ? (itemsTotal / project.budget) * 100 : 0;

  const [editingItemId, setEditingItemId] = useState(null);
  const [editingExecIdx, setEditingExecIdx] = useState(null);
  const [editingMatId, setEditingMatId] = useState(null);
  const [editingLaborId, setEditingLaborId] = useState(null);
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [editingOperId, setEditingOperId] = useState(null);

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // Convierte texto pegado o escrito a número, soportando ambos formatos de miles/decimales
  // (1.200,50 estilo boliviano o 1,200.50 estilo Excel en inglés) para que precios > 1000 no se pierdan.
  const toNum = (v) => {
    let s = String(v ?? "0").trim().replace(/[^\d.,-]/g, "");
    if (!s) return 0;
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > -1 && lastDot > -1) {
      // Tiene ambos separadores: el que aparece al final es el decimal, el otro es de miles.
      if (lastComma > lastDot) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (lastComma > -1) {
      // Solo coma: si son exactamente 3 dígitos después (y una sola coma), es separador de miles.
      const decimals = s.length - lastComma - 1;
      const commaCount = (s.match(/,/g) || []).length;
      s = decimals === 3 && commaCount === 1 ? s.replace(",", "") : s.replace(",", ".");
    } else if (lastDot > -1) {
      // Solo punto: si son exactamente 3 dígitos después (y un solo punto), es separador de miles.
      const decimals = s.length - lastDot - 1;
      const dotCount = (s.match(/\./g) || []).length;
      if (decimals === 3 && dotCount === 1) s = s.replace(".", "");
    }
    return Number(s) || 0;
  };

  const importItems = () => {
    const rows = pasteText
      .trim()
      .split("\n")
      .map((line) => line.split("\t").map((c) => c.trim()))
      .filter((cols) => cols.length >= 3 && cols.some((c) => c));
    if (!rows.length) return;
    const newItems = rows.map((cols, idx) => {
      const pu = cols[cols.length - 1];
      const qty = cols[cols.length - 2];
      const unit = cols.length >= 3 ? cols[cols.length - 3] : "";
      const desc = cols.length >= 4 ? cols[cols.length - 4] : cols[0] || "";
      const id = cols.length >= 5 ? cols[0] : `IT-${project.items.length + idx + 1}`;
      return { id, desc, unit, qty: toNum(qty), pu: toNum(pu) };
    });
    setProject({ ...project, items: [...project.items, ...newItems] });
    setPasteText("");
    setShowPaste(false);
  };

  // --- Ítems (manual) ---
  const openNewItem = () => {
    setItemForm(blankItem);
    setEditingItemId(null);
    setShowModal(true);
  };
  const openEditItem = (it) => {
    setItemForm({ id: it.id, desc: it.desc, unit: it.unit, qty: it.qty, pu: it.pu });
    setEditingItemId(it.id);
    setShowModal(true);
  };
  const saveItem = () => {
    if (!itemForm.id || !itemForm.desc) return;
    const record = { id: itemForm.id, desc: itemForm.desc, unit: itemForm.unit, qty: toNum(itemForm.qty), pu: toNum(itemForm.pu) };
    if (editingItemId) {
      setProject({ ...project, items: project.items.map((it) => (it.id === editingItemId ? record : it)) });
    } else {
      setProject({ ...project, items: [...project.items, record] });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró el ítem ${record.id} — ${record.desc} en "${project.name}".`);
    }
    setItemForm(blankItem);
    setEditingItemId(null);
    setShowModal(false);
  };
  const deleteItem = (id) => {
    askDelete("¿Eliminar este ítem? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, items: project.items.filter((it) => it.id !== id) });
    });
  };

  // --- Ejecución ---
  const openNewExec = () => {
    setExecForm(blankExec);
    setEditingExecIdx(null);
    setShowModal(true);
  };
  const openEditExec = (idx) => {
    const ex = project.executions[idx];
    setExecForm({ date: ex.date, itemId: ex.itemId, qty: ex.qty });
    setEditingExecIdx(idx);
    setShowModal(true);
  };
  const saveExec = () => {
    if (!execForm.qty || !execForm.itemId) return;
    if (editingExecIdx !== null) {
      setProject({
        ...project,
        executions: project.executions.map((ex, i) =>
          i === editingExecIdx ? { ...ex, ...execForm, qty: toNum(execForm.qty) } : ex
        ),
      });
    } else {
      setProject({ ...project, executions: [...project.executions, { id: genId("ex"), ...execForm, qty: toNum(execForm.qty) }] });
      if (role === "Residente" && onLog) {
        const it = project.items.find((i) => i.id === execForm.itemId);
        onLog(`${project.resident} registró ejecución de ${num2(toNum(execForm.qty))} ${it?.unit || ""} en el ítem ${execForm.itemId} de "${project.name}".`);
      }
    }
    setExecForm(blankExec);
    setEditingExecIdx(null);
    setShowModal(false);
  };
  const deleteExec = (idx) => {
    askDelete("¿Eliminar este registro de ejecución? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, executions: project.executions.filter((_, i) => i !== idx) });
    });
  };

  // --- Materiales ---
  const openNewMat = () => {
    setMatForm(blankMat);
    setEditingMatId(null);
    setShowModal(true);
  };
  const openEditMat = (m) => {
    setMatForm({ date: m.date, material: m.material, unit: m.unit, qty: m.qty, itemId: m.itemId, pu: m.pu, pay: m.pay, provider: m.provider });
    setEditingMatId(m.id);
    setShowModal(true);
  };
  const saveMat = () => {
    if (!matForm.material || !matForm.qty) return;
    if (editingMatId) {
      setProject({
        ...project,
        materials: project.materials.map((m) => (m.id === editingMatId ? { ...m, ...matForm, qty: toNum(matForm.qty), pu: toNum(matForm.pu) } : m)),
      });
    } else {
      setProject({
        ...project,
        materials: [...project.materials, { id: "m" + Date.now(), ...matForm, qty: toNum(matForm.qty), pu: toNum(matForm.pu) }],
      });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró material "${matForm.material}" (${num2(toNum(matForm.qty))} ${matForm.unit}) en "${project.name}".`);
    }
    setMatForm(blankMat);
    setEditingMatId(null);
    setShowModal(false);
  };
  const deleteMat = (id) => {
    askDelete("¿Eliminar este material? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, materials: project.materials.filter((m) => m.id !== id) });
    });
  };

  // --- Mano de obra ---
  const openNewLabor = () => {
    setLaborForm(blankLabor);
    setEditingLaborId(null);
    setShowModal(true);
  };
  const openEditLabor = (l) => {
    setLaborForm({
      payType: l.payType || "jornal",
      date: l.date,
      worker: l.worker,
      category: l.category,
      shift: l.shift || shifts[0],
      hours: l.hours,
      wage: l.wage,
      month: l.month || "",
      monthlySalary: l.monthlySalary || "",
      daysWorked: l.daysWorked || "",
    });
    setEditingLaborId(l.id);
    setShowModal(true);
  };
  const saveLabor = () => {
    const isMensual = laborForm.payType === "mensual";
    if (!laborForm.worker) return;
    if (isMensual && (!laborForm.month || !laborForm.monthlySalary)) return;
    if (!isMensual && !laborForm.hours) return;

    const normalized = isMensual
      ? {
          ...laborForm,
          hours: 0,
          wage: 0,
          monthlySalary: toNum(laborForm.monthlySalary),
          daysWorked: toNum(laborForm.daysWorked),
        }
      : { ...laborForm, hours: toNum(laborForm.hours), wage: toNum(laborForm.wage), monthlySalary: 0, daysWorked: 0 };

    if (editingLaborId) {
      setProject({
        ...project,
        laborDaily: project.laborDaily.map((l) => (l.id === editingLaborId ? { ...l, ...normalized } : l)),
      });
    } else {
      setProject({
        ...project,
        laborDaily: [...project.laborDaily, { id: "l" + Date.now(), ...normalized }],
      });
      if (role === "Residente" && onLog) {
        const msg = isMensual
          ? `${project.resident} registró personal mensual: ${laborForm.worker} (${laborForm.month}, ${money(normalized.monthlySalary)}) en "${project.name}".`
          : `${project.resident} registró un jornal de ${laborForm.worker} (${num2(toNum(laborForm.hours))} h, turno ${laborForm.shift}) en "${project.name}".`;
        onLog(msg);
      }
    }
    setLaborForm(blankLabor);
    setEditingLaborId(null);
    setShowModal(false);
  };
  const deleteLabor = (id) => {
    askDelete("¿Eliminar este jornal? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, laborDaily: project.laborDaily.filter((l) => l.id !== id) });
    });
  };

  // --- Maquinaria ---
  const openNewMachine = () => {
    setMachineForm(blankMachine);
    setEditingMachineId(null);
    setShowModal(true);
  };
  const openEditMachine = (m) => {
    setMachineForm({
      date: m.date,
      machine: m.machine,
      itemId: m.itemId,
      shift: m.shift || shifts[0],
      horIni: m.horIni ?? "",
      horFin: m.horFin ?? "",
      hours: m.hours,
      rate: m.rate,
    });
    setEditingMachineId(m.id);
    setShowModal(true);
  };
  // Si hay horómetro inicial y final, las horas trabajadas se calculan solas (final - inicial).
  const updateMachineHorometro = (field, value) => {
    const next = { ...machineForm, [field]: value };
    const ini = toNum(next.horIni);
    const fin = toNum(next.horFin);
    if (next.horIni !== "" && next.horFin !== "" && fin >= ini) {
      next.hours = String(fin - ini);
    }
    setMachineForm(next);
  };
  const saveMachine = () => {
    if (!machineForm.machine || !machineForm.hours) return;
    const normalized = {
      ...machineForm,
      horIni: machineForm.horIni === "" ? "" : toNum(machineForm.horIni),
      horFin: machineForm.horFin === "" ? "" : toNum(machineForm.horFin),
      hours: toNum(machineForm.hours),
      rate: toNum(machineForm.rate),
    };
    if (editingMachineId) {
      setProject({
        ...project,
        machinery: project.machinery.map((m) => (m.id === editingMachineId ? { ...m, ...normalized } : m)),
      });
    } else {
      setProject({
        ...project,
        machinery: [...project.machinery, { id: "mq" + Date.now(), ...normalized }],
      });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró maquinaria "${machineForm.machine}" (${num2(normalized.hours)} h, turno ${machineForm.shift}) en "${project.name}".`);
    }
    setMachineForm(blankMachine);
    setEditingMachineId(null);
    setShowModal(false);
  };
  const deleteMachine = (id) => {
    askDelete("¿Eliminar este registro de maquinaria? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, machinery: project.machinery.filter((m) => m.id !== id) });
    });
  };

  // --- Gastos de operación ---
  const openNewOper = () => {
    setOperForm(blankOper);
    setEditingOperId(null);
    setShowModal(true);
  };
  const openEditOper = (o) => {
    setOperForm({ date: o.date, category: o.category, amount: o.amount, desc: o.desc });
    setEditingOperId(o.id);
    setShowModal(true);
  };
  const saveOper = () => {
    if (!operForm.category || !operForm.amount) return;
    if (editingOperId) {
      setProject({
        ...project,
        operating: project.operating.map((o) => (o.id === editingOperId ? { ...o, ...operForm, amount: toNum(operForm.amount) } : o)),
      });
    } else {
      setProject({ ...project, operating: [...project.operating, { id: "o" + Date.now(), ...operForm, amount: toNum(operForm.amount) }] });
      if (role === "Residente" && onLog) onLog(`${project.resident} registró un gasto de operación de ${money(operForm.amount)} (${operForm.category}) en "${project.name}".`);
    }
    setOperForm(blankOper);
    setEditingOperId(null);
    setShowModal(false);
  };
  const deleteOper = (id) => {
    askDelete("¿Eliminar este gasto? Esta acción no se puede deshacer.", () => {
      setProject({ ...project, operating: project.operating.filter((o) => o.id !== id) });
    });
  };

  const totalMateriales = project.materials.reduce((a, m) => a + m.qty * m.pu, 0);
  const totalManoObra = project.laborDaily.reduce((a, l) => {
    if (l.payType === "mensual") {
      return a + (l.daysWorked > 0 ? (l.monthlySalary / 30) * l.daysWorked : l.monthlySalary);
    }
    return a + (l.hours / 8) * l.wage;
  }, 0);
  const totalMaquinaria = project.machinery.reduce((a, m) => a + m.hours * m.rate, 0);
  const totalOperacion = project.operating.reduce((a, o) => a + o.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              sub === t.key ? moduleColors[t.key] : "bg-stone-100 text-gray-500 hover:bg-stone-200"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {sub === "items" && (
        <>
          <SectionHeader
            title="Datos base / ítems de obra"
            action={
              <div className="flex gap-2">
                <PillButton variant="ghost" onClick={openNewItem}>
                  <Plus size={15} /> Nuevo ítem
                </PillButton>
                <PillButton className={moduleColors.items} onClick={() => setShowPaste(true)}>
                  <FileSpreadsheet size={15} /> Pegar desde Excel
                </PillButton>
              </div>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Suma total de ítems" value={money(itemsTotal)} icon={ClipboardList} />
            <KpiCard label="Presupuesto contratado" value={money(project.budget)} icon={Wallet} />
            <KpiCard
              label="Diferencia vs. presupuesto"
              value={money(budgetDiff)}
              tone={budgetDiff >= 0 ? "good" : "bad"}
              sub={budgetDiff >= 0 ? "dentro del presupuesto" : "excede el presupuesto"}
            />
            <KpiCard
              label="% del presupuesto"
              value={`${num2(budgetPct)}%`}
              tone={budgetPct > 100 ? "bad" : "default"}
              sub="ítems sobre presupuesto contratado"
            />
          </div>
          <Table
            columns={["Ítem", "Descripción", "Unidad", "Cantidad", "P. unitario", "P. total", "Ejecutado", "% avance", "Material asignado", "Acciones"]}
            rows={project.items.map((it) => {
              const ejec = execByItem[it.id] || 0;
              const pct = it.qty ? Math.min(100, (ejec / it.qty) * 100) : 0;
              const mat = materialByItem[it.id];
              return [
                it.id,
                it.desc,
                it.unit,
                num2(it.qty),
                money(it.pu),
                money(it.qty * it.pu),
                `${num2(ejec)} ${it.unit}`,
                `${num2(pct)}%`,
                mat ? `${money(mat.cost)} (${num2(mat.qty)} ${mat.unit})` : "—",
                <RowActions key={it.id} onEdit={() => openEditItem(it)} onDelete={() => deleteItem(it.id)} />,
              ];
            })}
          />
        </>
      )}

      {sub === "ejecucion" && (
        <>
          <SectionHeader
            title="Ejecución de ítems por día"
            action={
              <PillButton className={moduleColors.ejecucion} onClick={openNewExec}>
                <Plus size={15} /> Registrar ejecución
              </PillButton>
            }
          />
          <KpiCard
            label="Monto total ejecutado"
            value={money(project.executions.reduce((a, ex) => {
              const it = project.items.find((i) => i.id === ex.itemId);
              return a + ex.qty * (it?.pu || 0);
            }, 0))}
            sub={`${project.executions.length} registro${project.executions.length === 1 ? "" : "s"}`}
          />
          <Table
            columns={["Fecha", "Ítem", "Cantidad ejecutada", "P. unitario", "Valor ejecutado", "Acciones"]}
            rows={project.executions
              .map((ex, i) => ({ ...ex, _idx: i }))
              .slice()
              .reverse()
              .map((ex) => {
                const it = project.items.find((i) => i.id === ex.itemId);
                return [
                  ex.date,
                  `${ex.itemId} — ${it?.desc || ""}`,
                  `${num2(ex.qty)} ${it?.unit || ""}`,
                  money(it?.pu),
                  money(ex.qty * (it?.pu || 0)),
                  <RowActions key={ex._idx} onEdit={() => openEditExec(ex._idx)} onDelete={() => deleteExec(ex._idx)} />,
                ];
              })}
          />
        </>
      )}

      {sub === "materiales" && (
        <>
          <SectionHeader
            title="Registro de materiales (independiente de finanzas)"
            action={
              <PillButton className={moduleColors.materiales} onClick={openNewMat}>
                <Plus size={15} /> Registrar material
              </PillButton>
            }
          />
          <KpiCard label="Total materiales" value={money(totalMateriales)} />
          <Table
            columns={["Fecha", "Material", "Ítem", "Cantidad", "P. unitario", "P. total", "Pago", "Proveedor", "Acciones"]}
            rows={project.materials
              .slice()
              .reverse()
              .map((m) => [
                m.date,
                m.material,
                m.itemId,
                `${num2(m.qty)} ${m.unit}`,
                money(m.pu),
                money(m.qty * m.pu),
                m.pay,
                m.provider,
                <RowActions key={m.id} onEdit={() => openEditMat(m)} onDelete={() => deleteMat(m.id)} />,
              ])}
          />
        </>
      )}

      {sub === "manoObra" && (
        <>
          <SectionHeader
            title="Mano de obra por jornal"
            action={
              <PillButton className={moduleColors.manoObra} onClick={openNewLabor}>
                <Plus size={15} /> Registrar jornal
              </PillButton>
            }
          />
          <KpiCard label="Total mano de obra" value={money(totalManoObra)} />
          <Table
            columns={["Fecha", "Trabajador", "Categoría", "Tipo", "Turno / Mes", "Horas / Días", "Jornal / Sueldo mensual", "Total", "Acciones"]}
            rows={project.laborDaily
              .slice()
              .reverse()
              .map((l) =>
                l.payType === "mensual"
                  ? [
                      l.date || "—",
                      l.worker,
                      l.category,
                      "Mensual",
                      l.month || "—",
                      l.daysWorked > 0 ? `${num2(l.daysWorked)} d` : "Mes completo",
                      money(l.monthlySalary),
                      money(l.daysWorked > 0 ? (l.monthlySalary / 30) * l.daysWorked : l.monthlySalary),
                      <RowActions key={l.id} onEdit={() => openEditLabor(l)} onDelete={() => deleteLabor(l.id)} />,
                    ]
                  : [
                      l.date,
                      l.worker,
                      l.category,
                      "Jornal",
                      l.shift || "—",
                      num2(l.hours),
                      money(l.wage),
                      money((l.hours / 8) * l.wage),
                      <RowActions key={l.id} onEdit={() => openEditLabor(l)} onDelete={() => deleteLabor(l.id)} />,
                    ]
              )}
          />
          <p className="text-xs text-slate-400">
            El personal con sueldo mensual se registra con su mes, sueldo y días trabajados; si dejas los días en blanco se asume el mes completo.
          </p>
        </>
      )}

      {sub === "maquinaria" && (
        <>
          <SectionHeader
            title="Maquinaria y equipo"
            action={
              <PillButton className={moduleColors.maquinaria} onClick={openNewMachine}>
                <Plus size={15} /> Registrar maquinaria
              </PillButton>
            }
          />
          <KpiCard label="Total maquinaria" value={money(totalMaquinaria)} />
          <Table
            columns={["Fecha", "Maquinaria", "Ítem", "Turno", "Horóm. inicial", "Horóm. final", "Horas", "Tarifa/hora", "Total", "Acciones"]}
            rows={project.machinery
              .slice()
              .reverse()
              .map((m) => [
                m.date,
                m.machine,
                m.itemId,
                m.shift || "—",
                m.horIni !== "" && m.horIni != null ? num2(m.horIni) : "—",
                m.horFin !== "" && m.horFin != null ? num2(m.horFin) : "—",
                num2(m.hours),
                money(m.rate),
                money(m.hours * m.rate),
                <RowActions key={m.id} onEdit={() => openEditMachine(m)} onDelete={() => deleteMachine(m.id)} />,
              ])}
          />
        </>
      )}

      {sub === "operacion" && (
        <>
          <SectionHeader
            title="Gastos de operación"
            action={
              <PillButton className={moduleColors.operacion} onClick={openNewOper}>
                <Plus size={15} /> Registrar gasto
              </PillButton>
            }
          />
          <KpiCard label="Total gastos de operación" value={money(totalOperacion)} />
          <Table
            columns={["Fecha", "Categoría", "Monto", "Descripción", "Acciones"]}
            rows={project.operating
              .slice()
              .reverse()
              .map((o) => [
                o.date,
                o.category,
                money(o.amount),
                o.desc,
                <RowActions key={o.id} onEdit={() => openEditOper(o)} onDelete={() => deleteOper(o.id)} />,
              ])}
          />
        </>
      )}

      {showModal && sub === "items" && (
        <Modal title={editingItemId ? "Editar ítem" : "Nuevo ítem"} onClose={() => setShowModal(false)}>
          <Field label="Código del ítem">
            <input className={inputCls} value={itemForm.id} onChange={(e) => setItemForm({ ...itemForm, id: e.target.value })} placeholder="1.1" disabled={!!editingItemId} />
          </Field>
          <Field label="Descripción">
            <input className={inputCls} value={itemForm.desc} onChange={(e) => setItemForm({ ...itemForm, desc: e.target.value })} />
          </Field>
          <Field label="Unidad">
            <input className={inputCls} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="m², m³, pza..." />
          </Field>
          <Field label="Cantidad">
            <input type="number" className={inputCls} value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} />
          </Field>
          <Field label="Precio unitario (Bs)">
            <input type="number" className={inputCls} value={itemForm.pu} onChange={(e) => setItemForm({ ...itemForm, pu: e.target.value })} />
          </Field>
          <PillButton className={moduleColors.items} onClick={saveItem}>
            {editingItemId ? "Guardar cambios" : "Guardar ítem"}
          </PillButton>
        </Modal>
      )}

      {showModal && sub === "ejecucion" && (
        <Modal title={editingExecIdx !== null ? "Editar ejecución diaria" : "Registrar ejecución diaria"} onClose={() => setShowModal(false)}>
          <Field label="Fecha">
            <input type="date" className={inputCls} value={execForm.date} onChange={(e) => setExecForm({ ...execForm, date: e.target.value })} />
          </Field>
          <Field label="Ítem">
            <select className={inputCls} value={execForm.itemId} onChange={(e) => setExecForm({ ...execForm, itemId: e.target.value })}>
              {project.items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.id} — {it.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad ejecutada">
            <input type="number" className={inputCls} value={execForm.qty} onChange={(e) => setExecForm({ ...execForm, qty: e.target.value })} />
          </Field>
          <PillButton className={moduleColors.ejecucion} onClick={saveExec}>
            {editingExecIdx !== null ? "Guardar cambios" : "Guardar ejecución"}
          </PillButton>
        </Modal>
      )}

      {showPaste && (
        <Modal title="Pegar ítems desde Excel" onClose={() => setShowPaste(false)}>
          <p className="text-xs text-gray-500 leading-relaxed">
            Copia las columnas de Excel en este orden: <b>Código, Descripción, Unidad, Cantidad, Precio unitario</b> (una fila por ítem) y pégalas aquí abajo.
            También funciona si copias solo 4 columnas sin el código (Descripción, Unidad, Cantidad, Precio unitario) — el código se genera automáticamente.
          </p>
          <textarea
            rows={8}
            className={inputCls + " font-mono text-xs"}
            placeholder={"1.1\tEnlosetado cerámico\tm²\t1000\t120\n1.2\tMuro de ladrillo 6h\tm²\t850\t95"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <PillButton className={moduleColors.items} onClick={importItems}>
            Importar ítems
          </PillButton>
        </Modal>
      )}

      {showModal && sub === "materiales" && (
        <Modal title={editingMatId ? "Editar material" : "Registrar material"} onClose={() => setShowModal(false)}>
          <Field label="Fecha">
            <input type="date" className={inputCls} value={matForm.date} onChange={(e) => setMatForm({ ...matForm, date: e.target.value })} />
          </Field>
          <Field label="Material">
            <input className={inputCls} value={matForm.material} onChange={(e) => setMatForm({ ...matForm, material: e.target.value })} placeholder="Cemento, arena, fierro..." />
          </Field>
          <Field label="Unidad">
            <input className={inputCls} value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} placeholder="Bolsa, m³, pza..." />
          </Field>
          <Field label="Cantidad">
            <input type="number" className={inputCls} value={matForm.qty} onChange={(e) => setMatForm({ ...matForm, qty: e.target.value })} />
          </Field>
          <Field label="Ítem donde se usó">
            <select className={inputCls} value={matForm.itemId} onChange={(e) => setMatForm({ ...matForm, itemId: e.target.value })}>
              {project.items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.id} — {it.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Precio unitario (Bs)">
            <input type="number" className={inputCls} value={matForm.pu} onChange={(e) => setMatForm({ ...matForm, pu: e.target.value })} />
          </Field>
          <Field label="Forma de pago">
            <select className={inputCls} value={matForm.pay} onChange={(e) => setMatForm({ ...matForm, pay: e.target.value })}>
              {["Contado", "Pagado", "Fiado"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Proveedor">
            <input className={inputCls} value={matForm.provider} onChange={(e) => setMatForm({ ...matForm, provider: e.target.value })} />
          </Field>
          <PillButton className={moduleColors.materiales} onClick={saveMat}>
            {editingMatId ? "Guardar cambios" : "Guardar material"}
          </PillButton>
        </Modal>
      )}

      {showModal && sub === "manoObra" && (
        <Modal title={editingLaborId ? "Editar registro" : "Registrar personal"} onClose={() => setShowModal(false)}>
          <Field label="Tipo de personal">
            <div className="flex bg-stone-100 rounded-lg p-0.5">
              {[
                { key: "jornal", label: "Por jornal" },
                { key: "mensual", label: "Personal mensual" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setLaborForm({ ...laborForm, payType: t.key })}
                  className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                    laborForm.payType === t.key ? "bg-white shadow-sm text-slate-800 font-medium" : "text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Trabajador">
            <input className={inputCls} value={laborForm.worker} onChange={(e) => setLaborForm({ ...laborForm, worker: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <input className={inputCls} value={laborForm.category} onChange={(e) => setLaborForm({ ...laborForm, category: e.target.value })} placeholder="Albañil, ayudante, peón..." />
          </Field>

          {laborForm.payType === "mensual" ? (
            <>
              <Field label="Mes">
                <input type="month" className={inputCls} value={laborForm.month} onChange={(e) => setLaborForm({ ...laborForm, month: e.target.value })} />
              </Field>
              <Field label="Sueldo mensual (Bs)">
                <input
                  type="number"
                  className={inputCls}
                  value={laborForm.monthlySalary}
                  onChange={(e) => setLaborForm({ ...laborForm, monthlySalary: e.target.value })}
                />
              </Field>
              <Field label="Días trabajados en el mes (opcional)">
                <input
                  type="number"
                  className={inputCls}
                  value={laborForm.daysWorked}
                  onChange={(e) => setLaborForm({ ...laborForm, daysWorked: e.target.value })}
                  placeholder="Déjalo vacío para asumir el mes completo"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Fecha">
                <input type="date" className={inputCls} value={laborForm.date} onChange={(e) => setLaborForm({ ...laborForm, date: e.target.value })} />
              </Field>
              <Field label="Turno">
                <select className={inputCls} value={laborForm.shift} onChange={(e) => setLaborForm({ ...laborForm, shift: e.target.value })}>
                  {shifts.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Horas trabajadas">
                <input type="number" className={inputCls} value={laborForm.hours} onChange={(e) => setLaborForm({ ...laborForm, hours: e.target.value })} />
              </Field>
              <Field label="Jornal (Bs/día)">
                <input type="number" className={inputCls} value={laborForm.wage} onChange={(e) => setLaborForm({ ...laborForm, wage: e.target.value })} />
              </Field>
            </>
          )}

          <PillButton className={moduleColors.manoObra} onClick={saveLabor}>
            {editingLaborId ? "Guardar cambios" : "Guardar registro"}
          </PillButton>
        </Modal>
      )}

      {showModal && sub === "maquinaria" && (
        <Modal title={editingMachineId ? "Editar maquinaria" : "Registrar maquinaria"} onClose={() => setShowModal(false)}>
          <Field label="Fecha">
            <input type="date" className={inputCls} value={machineForm.date} onChange={(e) => setMachineForm({ ...machineForm, date: e.target.value })} />
          </Field>
          <Field label="Maquinaria">
            <input className={inputCls} value={machineForm.machine} onChange={(e) => setMachineForm({ ...machineForm, machine: e.target.value })} placeholder="Excavadora, volqueta, mezcladora..." />
          </Field>
          <Field label="Ítem donde se utilizó">
            <select className={inputCls} value={machineForm.itemId} onChange={(e) => setMachineForm({ ...machineForm, itemId: e.target.value })}>
              {project.items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.id} — {it.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Turno">
            <select className={inputCls} value={machineForm.shift} onChange={(e) => setMachineForm({ ...machineForm, shift: e.target.value })}>
              {shifts.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Horómetro inicial">
            <input
              type="number"
              className={inputCls}
              value={machineForm.horIni}
              onChange={(e) => updateMachineHorometro("horIni", e.target.value)}
              placeholder="Lectura al iniciar"
            />
          </Field>
          <Field label="Horómetro final">
            <input
              type="number"
              className={inputCls}
              value={machineForm.horFin}
              onChange={(e) => updateMachineHorometro("horFin", e.target.value)}
              placeholder="Lectura al terminar"
            />
          </Field>
          <Field label="Horas trabajadas">
            <input type="number" className={inputCls} value={machineForm.hours} onChange={(e) => setMachineForm({ ...machineForm, hours: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-400 -mt-2">
            Si registras el horómetro inicial y final, las horas trabajadas se calculan automáticamente (puedes ajustarlas si es necesario).
          </p>
          <Field label="Tarifa por hora (Bs)">
            <input type="number" className={inputCls} value={machineForm.rate} onChange={(e) => setMachineForm({ ...machineForm, rate: e.target.value })} />
          </Field>
          <PillButton className={moduleColors.maquinaria} onClick={saveMachine}>
            {editingMachineId ? "Guardar cambios" : "Guardar maquinaria"}
          </PillButton>
        </Modal>
      )}

      {showModal && sub === "operacion" && (
        <Modal title={editingOperId ? "Editar gasto" : "Registrar gasto de operación"} onClose={() => setShowModal(false)}>
          <Field label="Fecha">
            <input type="date" className={inputCls} value={operForm.date} onChange={(e) => setOperForm({ ...operForm, date: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <input className={inputCls} value={operForm.category} onChange={(e) => setOperForm({ ...operForm, category: e.target.value })} placeholder="Combustible, viáticos, papelería..." />
          </Field>
          <Field label="Monto (Bs)">
            <input type="number" className={inputCls} value={operForm.amount} onChange={(e) => setOperForm({ ...operForm, amount: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <input className={inputCls} value={operForm.desc} onChange={(e) => setOperForm({ ...operForm, desc: e.target.value })} />
          </Field>
          <PillButton className={moduleColors.operacion} onClick={saveOper}>
            {editingOperId ? "Guardar cambios" : "Guardar gasto"}
          </PillButton>
        </Modal>
      )}
      {deleteModal}
    </div>
  );
}

/* ---------------------------------------------------------
   REPORTES
--------------------------------------------------------- */

function ReportesTab({ project }) {
  const reports = REPORTS;
  const [exportingKey, setExportingKey] = useState(""); // "<reporte>-pdf" | "<reporte>-excel"
  const [exportError, setExportError] = useState("");

  const [rangeMode, setRangeMode] = useState("rango");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [weekValue, setWeekValue] = useState("");
  const [dayValue, setDayValue] = useState("");

  const range = useMemo(() => {
    if (rangeMode === "rango") return dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null;
    if (rangeMode === "mes") return monthToRange(monthValue);
    if (rangeMode === "semana") return isoWeekToRange(weekValue);
    if (rangeMode === "dia") return dayValue ? { from: dayValue, to: dayValue } : null;
    return null;
  }, [rangeMode, dateFrom, dateTo, monthValue, weekValue, dayValue]);

  const inRange = (d) => (range ? d >= range.from && d <= range.to : true);
  const countIncome = project.income.filter((i) => inRange(i.date)).length;
  const countExpense = project.expenses.filter((e) => inRange(e.date)).length;
  const countExec = project.executions.filter((ex) => inRange(ex.date)).length;
  const countMat = project.materials.filter((m) => inRange(m.date)).length;
  const periodLabel = range ? (range.from === range.to ? range.from : `${range.from} → ${range.to}`) : "todo el proyecto (sin filtro de fecha)";

  const rangeModes = [
    { key: "rango", label: "Rango de fechas" },
    { key: "mes", label: "Por mes" },
    { key: "semana", label: "Por semana" },
    { key: "dia", label: "Un solo día" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionHeader title="Periodo del reporte" />
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {rangeModes.map((m) => (
              <button
                key={m.key}
                onClick={() => setRangeMode(m.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  rangeMode === m.key ? "bg-slate-800 text-white" : "bg-stone-100 text-gray-500 hover:bg-stone-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {rangeMode === "rango" && (
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <Field label="Desde">
                <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Field>
              <Field label="Hasta">
                <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Field>
            </div>
          )}
          {rangeMode === "mes" && (
            <div className="max-w-xs">
              <Field label="Mes">
                <input type="month" className={inputCls} value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
              </Field>
            </div>
          )}
          {rangeMode === "semana" && (
            <div className="max-w-xs">
              <Field label="Semana">
                <input type="week" className={inputCls} value={weekValue} onChange={(e) => setWeekValue(e.target.value)} />
              </Field>
            </div>
          )}
          {rangeMode === "dia" && (
            <div className="max-w-xs">
              <Field label="Día">
                <input type="date" className={inputCls} value={dayValue} onChange={(e) => setDayValue(e.target.value)} />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-100">
            <p className="text-xs text-gray-500">
              Periodo seleccionado: <span className="font-medium text-slate-800">{periodLabel}</span>
            </p>
            <p className="text-xs text-gray-500">{countIncome} ingresos · {countExpense} egresos · {countExec} ejecuciones · {countMat} materiales en ese rango</p>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Reportes disponibles" />
        {exportError && (
          <p className="text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 mb-2">{exportError}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => {
            const doExport = (kind) => {
              const key = `${r}-${kind}`;
              setExportError("");
              setExportingKey(key);
              // setTimeout deja pintar el estado "generando..." antes del trabajo síncrono de armar el archivo
              setTimeout(() => {
                try {
                  if (kind === "pdf") exportReportToPDF(r, project, periodLabel, inRange);
                  else exportReportToExcel(r, project, periodLabel, inRange);
                } catch (err) {
                  setExportError(`No se pudo generar "${r}" en ${kind === "pdf" ? "PDF" : "Excel"}: ${err.message || err}`);
                } finally {
                  setExportingKey("");
                }
              }, 30);
            };
            return (
              <div key={r} className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-800 font-medium">{r}</span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => doExport("pdf")}
                    disabled={exportingKey === `${r}-pdf`}
                    className="text-xs px-2 py-1 rounded-md border border-stone-300 text-gray-500 hover:bg-stone-100 flex items-center gap-1 disabled:opacity-50"
                  >
                    <FileDown size={12} /> {exportingKey === `${r}-pdf` ? "Generando…" : "PDF"}
                  </button>
                  <button
                    onClick={() => doExport("excel")}
                    disabled={exportingKey === `${r}-excel`}
                    className="text-xs px-2 py-1 rounded-md border border-stone-300 text-gray-500 hover:bg-stone-100 flex items-center gap-1 disabled:opacity-50"
                  >
                    <FileSpreadsheet size={12} /> {exportingKey === `${r}-excel` ? "Generando…" : "Excel"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader title="Vista previa: materiales asignados por ítem" />
        <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-4">
          {project.items.length === 0 && <p className="text-sm text-gray-500">Este proyecto todavía no tiene ítems cargados.</p>}
          {project.items.map((it) => {
            const mats = project.materials.filter((m) => m.itemId === it.id && inRange(m.date));
            const subtotalCost = mats.reduce((a, m) => a + m.qty * m.pu, 0);
            return (
              <div key={it.id}>
                <p className="text-sm font-medium text-slate-700 mb-1.5">
                  {it.id} — {it.desc}
                </p>
                <Table
                  columns={["Material", "Cantidad", "P. unitario", "P. total"]}
                  rows={mats.map((m) => [m.material, `${num2(m.qty)} ${m.unit}`, money(m.pu), money(m.qty * m.pu)])}
                  emptyLabel="Sin materiales asignados a este ítem en el periodo seleccionado."
                />
                {mats.length > 0 && <p className="text-xs text-gray-500 mt-1">Subtotal: {money(subtotalCost)}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   VISTA DE PROYECTO (con tabs)
--------------------------------------------------------- */

function ProjectView({ project, setProject, onBack, role, onLog, residentOptions = [] }) {
  const [tab, setTab] = useState("resumen");
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const st = statusStyle[project.status];
  const tabs = [
    { key: "resumen", label: "Resumen" },
    { key: "financiero", label: "Control Financiero" },
    { key: "fisico", label: "Control Físico" },
    { key: "reportes", label: "Reportes" },
  ];

  const openEdit = () => {
    setEditForm({
      name: project.name,
      code: project.code,
      client: project.client,
      location: project.location,
      budget: project.budget,
      start: project.start,
      end: project.end,
      resident: project.resident,
      residentUserId: project.residentUserId || "",
      status: project.status,
    });
    setShowEdit(true);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-slate-800 mb-3">
        <ArrowLeft size={15} /> Proyectos
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-slate-400 font-medium">{project.code}</p>
          <h1 className="text-2xl font-semibold text-slate-800">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.client} · {project.location} · Residente: {project.resident}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1.5 rounded-full ${st.bg} ${st.text} flex items-center gap-1.5 h-fit`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {project.status}
          </span>
          {role === "Administrador" && (
            <PillButton variant="ghost" onClick={openEdit}>
              <Pencil size={14} /> Editar proyecto
            </PillButton>
          )}
        </div>
      </div>

      {showEdit && editForm && (
        <Modal title="Editar proyecto" onClose={() => setShowEdit(false)}>
          <ProjectFormFields form={editForm} setForm={setEditForm} residentOptions={residentOptions} />
          <PillButton
            variant="accent"
            onClick={() => {
              setProject({ ...project, ...editForm, budget: Number(editForm.budget) || 0 });
              setShowEdit(false);
            }}
          >
            Guardar cambios
          </PillButton>
        </Modal>
      )}

      <div className="flex gap-1 border-b border-stone-200 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-orange-500 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab project={project} setProject={setProject} />}
      {tab === "financiero" && <FinancieroTab project={project} setProject={setProject} onLog={onLog} role={role} />}
      {tab === "fisico" && <FisicoTab project={project} setProject={setProject} onLog={onLog} role={role} />}
      {tab === "reportes" && <ReportesTab project={project} />}
    </div>
  );
}

/* ---------------------------------------------------------
   PANEL PRINCIPAL (conectado a Supabase)
   Reemplaza el antiguo componente raíz de la vista previa:
   ahora el rol viene de una sesión real (login), los proyectos
   se cargan de la base de datos, y "Usuarios" permite crear
   nuevas cuentas sin salir de la aplicación.
--------------------------------------------------------- */

export default function Dashboard({
  profile,
  initialProjects,
  profiles,
  offlineSnapshot,
  onRefreshProfiles,
  initialActivity,
  onLogout,
  onPersistProjectChange,
  onCreateProject,
  onUpdateProjectHeader,
  onLogActivity,
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState("projects"); // "projects" | "users"
  const role = profile.role; // "Administrador" | "Residente"
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(initialActivity || []);
  const [showNotifs, setShowNotifs] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [savingError, setSavingError] = useState("");

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const logActivity = (msg, projectId) => {
    setNotifications((prev) => [{ id: "tmp" + Date.now(), msg, time: new Date().toLocaleString("es-BO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) }, ...prev].slice(0, 30));
    onLogActivity(msg, projectId).catch(() => {});
  };

  const selected = projects.find((p) => p.id === selectedId);

  // Cambios que quedaron pendientes de sincronizar (p. ej. por estar sin conexión):
  // projectId -> estado del proyecto ANTES del primer cambio que no se pudo guardar.
  // Se reintenta automáticamente cuando vuelve la conexión (ver efecto más abajo).
  const pendingSyncRef = useRef({});

  // Guarda el proyecto localmente (respuesta inmediata) y sincroniza con
  // Supabase en segundo plano. Si algo falla al guardar (p. ej. sin conexión),
  // el cambio queda en memoria y se reintenta solo al reconectarse.
  const setSelectedProject = (updated) => {
    const old = projects.find((p) => p.id === updated.id);
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
    if (old) {
      if (!(updated.id in pendingSyncRef.current)) pendingSyncRef.current[updated.id] = old;
      onPersistProjectChange(old, updated)
        .then(() => {
          delete pendingSyncRef.current[updated.id];
        })
        .catch((err) => {
          setSavingError(`No se pudo guardar en la base de datos: ${err.message || err}`);
        });
    }
  };

  // Al recuperar la conexión, reintenta guardar cualquier cambio que se hizo mientras
  // estaba offline (comparando contra el estado justo antes del primer cambio fallido).
  useEffect(() => {
    const retryPending = () => {
      const pendingIds = Object.keys(pendingSyncRef.current);
      if (pendingIds.length === 0) return;
      pendingIds.forEach((pid) => {
        const baseline = pendingSyncRef.current[pid];
        const current = projects.find((p) => p.id === pid);
        if (!current) return;
        onPersistProjectChange(baseline, current)
          .then(() => {
            delete pendingSyncRef.current[pid];
            setSavingError("");
          })
          .catch((err) => {
            setSavingError(`No se pudo sincronizar el proyecto "${current.name}": ${err.message || err}`);
          });
      });
    };
    window.addEventListener("online", retryPending);
    return () => window.removeEventListener("online", retryPending);
  }, [projects, onPersistProjectChange]);

  const residentOptions = (profiles || []).filter((p) => p.role === "Residente");

  const visibleProjects = useMemo(() => {
    let list = projects;
    if (role === "Residente") list = list.filter((p) => p.residentUserId === profile.id);
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.code || "").toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [projects, role, query, profile.id]);

  const handleCreate = async (form) => {
    try {
      const created = await onCreateProject(form);
      setProjects([{ ...created, items: [], executions: [], income: [], expenses: [], materials: [], laborDaily: [], machinery: [], operating: [], schedule: [] }, ...projects]);
    } catch (err) {
      setSavingError(`No se pudo crear el proyecto: ${err.message || err}`);
    }
  };

  const handleEdit = async (id, form) => {
    const merged = { ...projects.find((p) => p.id === id), ...form, budget: Number(form.budget) || 0 };
    setProjects(projects.map((p) => (p.id === id ? merged : p)));
    try {
      await onUpdateProjectHeader(id, merged);
    } catch (err) {
      setSavingError(`No se pudo guardar el proyecto: ${err.message || err}`);
    }
  };

  const isMobile = device === "mobile";

  const goProjects = () => {
    setPage("projects");
    setSelectedId(null);
  };
  const goUsers = () => {
    setPage("users");
    setSelectedId(null);
  };

  const content = (
    <div className={`flex ${isMobile ? "flex-col" : ""} bg-stone-100 text-slate-800`} style={{ minHeight: isMobile ? 700 : 640, fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      {offlineSnapshot && (
        <div className="w-full bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center gap-1.5 justify-center order-first">
          <WifiOff size={12} /> Sin conexión — mostrando la última información guardada en este dispositivo
          {typeof offlineSnapshot === "string" ? ` (${new Date(offlineSnapshot).toLocaleString("es-BO")})` : ""}. Los cambios se sincronizarán cuando vuelva la conexión.
        </div>
      )}
      {!offlineSnapshot && !isOnline && (
        <div className="w-full bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center gap-1.5 justify-center order-first">
          <WifiOff size={12} /> Sin conexión — reconéctate para poder guardar tus registros.
        </div>
      )}
      {savingError && (
        <div className="w-full bg-red-600 text-white text-xs px-4 py-1.5 flex items-center gap-1.5 justify-between order-first">
          <span>{savingError}</span>
          <button onClick={() => setSavingError("")} className="underline">
            Cerrar
          </button>
        </div>
      )}

      {/* SIDEBAR (escritorio) */}
      {!isMobile && (
        <aside className="w-52 bg-slate-800 text-white flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Building2 size={17} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Control de</p>
              <p className="text-sm font-semibold -mt-0.5">Obras</p>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 mt-2">
            <button
              onClick={goProjects}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === "projects" && !selectedId ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={16} /> Proyectos
            </button>
            {role === "Administrador" && (
              <button
                onClick={goUsers}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  page === "users" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                }`}
              >
                <Users size={16} /> Usuarios
              </button>
            )}
          </nav>
          <div className="mt-auto p-4 flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium truncate">{profile.fullName || profile.email}</p>
              <p className="text-xs text-white/40">{role}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={13} /> Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
            <span className="text-slate-800 font-medium truncate">{page === "users" ? "Usuarios" : "Proyectos"}</span>
            {selected && (
              <>
                <ChevronRight size={13} className="shrink-0" />
                <span className="text-slate-800 font-medium truncate">{selected.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!selected && page === "projects" && !isMobile && (
              <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 w-64">
                <Search size={14} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar proyecto..."
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Notificaciones — visible para Administrador: avisa qué registró el Residente */}
            {role === "Administrador" && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-stone-300 text-gray-500 hover:bg-stone-100"
                  title="Notificaciones"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-slate-800">
                          Limpiar
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 px-4 py-6 text-center">
                        Sin novedades todavía. Aquí verás avisos cuando un residente registre algo.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-2.5 border-b border-stone-50 last:border-0">
                          <p className="text-xs text-slate-700">{n.msg}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vista escritorio / celular */}
            <div className="flex bg-stone-100 rounded-lg p-0.5">
              <button
                onClick={() => setDevice("desktop")}
                title="Vista escritorio"
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                  device === "desktop" ? "bg-white shadow-sm text-slate-800" : "text-gray-500"
                }`}
              >
                <Monitor size={15} />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                title="Vista celular"
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                  device === "mobile" ? "bg-white shadow-sm text-slate-800" : "text-gray-500"
                }`}
              >
                <Smartphone size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {page === "users" && role === "Administrador" ? (
            <UsersView profiles={profiles} onRefresh={onRefreshProfiles} currentUserId={profile.id} />
          ) : selected ? (
            <ProjectView
              project={selected}
              setProject={setSelectedProject}
              onBack={goProjects}
              role={role}
              onLog={(msg) => logActivity(msg, selected.id)}
              residentOptions={residentOptions}
            />
          ) : (
            <ProjectsView
              projects={visibleProjects}
              onOpen={setSelectedId}
              onCreate={handleCreate}
              onEdit={handleEdit}
              role={role}
              residentOptions={residentOptions}
            />
          )}
        </div>
      </main>

      {/* Barra inferior (celular) */}
      {isMobile && (
        <div className="flex items-center justify-around bg-slate-800 text-white py-2 shrink-0">
          <button onClick={goProjects} className="flex flex-col items-center gap-0.5 text-[10px] px-3 py-1">
            <LayoutGrid size={17} />
            Proyectos
          </button>
          {role === "Administrador" && (
            <button onClick={goUsers} className="flex flex-col items-center gap-0.5 text-[10px] px-3 py-1 text-white/60">
              <Users size={17} />
              Usuarios
            </button>
          )}
          <button onClick={onLogout} className="flex flex-col items-center gap-0.5 text-[10px] px-3 py-1 text-white/60">
            <LogOut size={17} />
            Salir
          </button>
        </div>
      )}
    </div>
  );

  if (!isMobile) return content;

  return (
    <div className="mx-auto" style={{ width: 390, border: "10px solid #1e293b", borderRadius: 40, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.35)" }}>
      {content}
    </div>
  );
}
