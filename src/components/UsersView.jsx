import React, { useState } from "react";
import { Plus, X, Users as UsersIcon } from "lucide-react";
import { createUser, updateUserRole } from "../lib/api.js";

const inputCls =
  "border border-stone-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500">{label}</span>
      {children}
    </label>
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

const blankForm = { fullName: "", email: "", password: "", role: "Residente" };

export default function UsersView({ profiles, onRefresh, currentUserId }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savingRoleId, setSavingRoleId] = useState(null);

  const handleCreate = async () => {
    setError("");
    if (!form.fullName || !form.email || !form.password) {
      setError("Completa nombre, correo y contraseña.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await createUser(form);
      setShowNew(false);
      setForm(blankForm);
      await onRefresh();
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (profile, role) => {
    setSavingRoleId(profile.id);
    try {
      await updateUserRole(profile.id, role, profile.fullName);
      await onRefresh();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el rol.");
    } finally {
      setSavingRoleId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <UsersIcon size={18} /> Usuarios
        </h2>
        <button
          onClick={() => {
            setForm(blankForm);
            setError("");
            setShowNew(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
        >
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Aquí puedes crear cuentas para tus empleados, vendedores o residentes de obra, sin volver a
        Supabase. Cada uno ingresará con el correo y contraseña que definas aquí.
      </p>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-100 text-gray-500 text-left">
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-stone-200">
                <td className="px-3 py-2 text-slate-800 whitespace-nowrap">
                  {p.fullName || "—"} {p.id === currentUserId && <span className="text-xs text-slate-400">(tú)</span>}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{p.email}</td>
                <td className="px-3 py-2">
                  <select
                    className={inputCls + " py-1"}
                    value={p.role}
                    disabled={savingRoleId === p.id || p.id === currentUserId}
                    onChange={(e) => handleRoleChange(p, e.target.value)}
                  >
                    <option>Administrador</option>
                    <option>Residente</option>
                  </select>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-400 text-sm">
                  Todavía no hay usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <Modal title="Nuevo usuario" onClose={() => setShowNew(false)}>
          <Field label="Nombre completo">
            <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Correo electrónico">
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contraseña">
            <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Rol">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Residente</option>
              <option>Administrador</option>
            </select>
          </Field>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            disabled={saving}
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </Modal>
      )}
    </div>
  );
}
