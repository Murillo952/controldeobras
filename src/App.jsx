import React, { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient.js";
import {
  fetchProjects,
  fetchMyProfile,
  fetchProfiles,
  fetchRecentActivity,
  syncProjectChildren,
  createProject,
  updateProjectHeader,
  logActivity,
} from "./lib/api.js";
import Login from "./components/Login.jsx";
import Dashboard from "./components/ControlDeObras.jsx";

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-100 px-4">
      <p className="text-sm text-slate-500 text-center max-w-sm">{children}</p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = todavía no se sabe
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadError, setLoadError] = useState("");

  // 1) Escucha la sesión de Supabase (login / logout)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setProjects(null);
        setProfiles([]);
        setActivity([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) Cuando hay sesión, carga el perfil (rol) y los datos
  const loadAll = useCallback(async (userId) => {
    setLoadError("");
    try {
      const myProfile = await fetchMyProfile(userId);
      if (!myProfile) {
        setLoadError(
          "Tu cuenta inició sesión correctamente, pero todavía no tiene un perfil asignado en la base de datos. Pídele al administrador que revise el usuario en Supabase."
        );
        return;
      }
      setProfile(myProfile);
      const projectsData = await fetchProjects();
      setProjects(projectsData);
      if (myProfile.role === "Administrador") {
        const [allProfiles, recentActivity] = await Promise.all([fetchProfiles(), fetchRecentActivity()]);
        setProfiles(allProfiles);
        setActivity(recentActivity);
      }
    } catch (err) {
      setLoadError(err.message || String(err));
    }
  }, []);

  useEffect(() => {
    if (session === null) {
      setProfile(null);
      setProjects(null);
    } else if (session) {
      loadAll(session.user.id);
    }
  }, [session, loadAll]);

  if (!isSupabaseConfigured) return <Login />;
  if (session === undefined) return <FullScreenMessage>Cargando…</FullScreenMessage>;
  if (!session) return <Login />;

  if (loadError) {
    return (
      <FullScreenMessage>
        {loadError}
        <br />
        <button className="text-orange-600 underline mt-2" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </FullScreenMessage>
    );
  }

  if (!profile || !projects) return <FullScreenMessage>Cargando tus proyectos…</FullScreenMessage>;

  return (
    <Dashboard
      profile={profile}
      initialProjects={projects}
      profiles={profiles}
      onRefreshProfiles={async () => setProfiles(await fetchProfiles())}
      initialActivity={activity}
      onLogout={() => supabase.auth.signOut()}
      onPersistProjectChange={syncProjectChildren}
      onCreateProject={createProject}
      onUpdateProjectHeader={updateProjectHeader}
      onLogActivity={(msg, projectId) => logActivity(msg, projectId, profile.id)}
    />
  );
}
