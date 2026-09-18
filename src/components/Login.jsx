import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Control de Obras</h1>
          <p className="text-xs text-slate-400 text-center">Ingresa con el correo y contraseña que te asignó tu administrador.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 leading-relaxed">
            Esta aplicación todavía no está conectada a Supabase. Edita el archivo{" "}
            <code className="font-mono">src/lib/supabaseConfig.js</code> con la URL y la clave de tu
            proyecto.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Correo electrónico</span>
            <input
              type="email"
              autoComplete="username"
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 mt-1"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
