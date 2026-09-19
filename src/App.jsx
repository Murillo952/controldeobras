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
import { saveSnapshot, loadSnapshot, clearSnapshot } from "./lib/offlineCache.js";

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-100 px-4">
      <p className="text-sm text-slate-500 text-center max-w-sm">{children}</p>
    </div>
  );
}

// Red de seguridad: si algo inesperado falla al renderizar el Dashboard (por ejemplo,
// un dato con forma rara que llegó del respaldo local sin conexión), esto evita que la
// pantalla quede en blanco y en su lugar muestra un aviso con opción de recargar.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("Error inesperado en la app:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <FullScreenMessage>
          Ocurrió un error inesperado mostrando la aplicación.
          <br />
          <button className="text-orange-600 underline mt-2" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </FullScreenMessage>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [session, setSession] = useState(undefined); // undefined = todavía no se sabe
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [offlineSnapshot, setOfflineSnapshot] = useState(null); // fecha del respaldo local en uso, o null si los datos son en vivo

  // 1) Escucha la sesión de Supabase (login / logout)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Supabase intenta renovar el token de sesión en segundo plano. Si en ese momento
      // no hay internet, esa renovación falla y la librería puede avisar "sesión nula"
      // como si hubieras cerrado sesión, aunque el usuario nunca lo pidió. Si eso pasa
      // mientras estamos sin conexión, lo ignoramos: la app se queda con lo que ya tenía
      // cargado (o con el respaldo local) en vez de expulsar al usuario a la pantalla de
      // Login sin avisar.
      if (!newSession && typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setProjects(null);
        setProfiles([]);
        setActivity([]);
        setOfflineSnapshot(null);
        clearSnapshot();
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
      let loadedProfiles = [];
      let loadedActivity = [];
      if (myProfile.role === "Administrador") {
        const [allProfiles, recentActivity] = await Promise.all([fetchProfiles(), fetchRecentActivity()]);
        loadedProfiles = allProfiles;
        loadedActivity = recentActivity;
        setProfiles(allProfiles);
        setActivity(recentActivity);
      }
      // Todo cargó bien desde Supabase: guarda una copia local y se sale del modo "sin conexión" si estaba activo.
      setOfflineSnapshot(null);
      saveSnapshot({ profile: myProfile, projects: projectsData, profiles: loadedProfiles, activity: loadedActivity });
    } catch (err) {
      // Sin conexión (u otro error de red): si hay un respaldo local de una sesión anterior, se usa
      // para poder seguir viendo/trabajando con la última información conocida en vez de bloquear la app.
      const snapshot = loadSnapshot();
      if (snapshot && snapshot.profile) {
        setProfile(snapshot.profile);
        setProjects(snapshot.projects || []);
        setProfiles(snapshot.profiles || []);
        setActivity(snapshot.activity || []);
        setOfflineSnapshot(snapshot.savedAt || true);
      } else {
        setLoadError(err.message || String(err));
      }
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

  // Si estábamos mostrando el respaldo local (sin conexión) y vuelve la conexión,
  // se reintenta cargar en vivo desde Supabase automáticamente.
  useEffect(() => {
    if (!offlineSnapshot || !session) return;
    const retry = () => loadAll(session.user.id);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [offlineSnapshot, session, loadAll]);

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
      offlineSnapshot={offlineSnapshot}
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
