# Control de Obras

Aplicación para el control físico y financiero de proyectos de construcción,
con inicio de sesión real y datos guardados en una base de datos (Supabase).

Este documento te explica, paso a paso y sin tecnicismos, cómo dejar todo
funcionando.

---

## Resumen rápido (si ya sabes lo que haces)

1. En Supabase: pega y ejecuta `supabase/01_schema.sql` en el SQL Editor.
2. En Supabase: Authentication → Users → Add user → crea tu usuario admin.
3. En Supabase: edita el correo dentro de `supabase/02_hacer_administrador.sql`,
   pégalo en el SQL Editor y ejecútalo.
4. Copia `.env.example`, renómbralo a `.env` y pon tu Project URL y tu clave anon.
5. Sube este proyecto a Netlify (o arrastra la carpeta ya compilada) y agrega
   esas mismas dos variables en Site settings → Environment variables.
6. Entra a la app con tu correo y contraseña de administrador.

Si quieres el detalle de cada paso, sigue leyendo.

---

## Parte 1 — Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (si no
   tienes uno todavía). Elige una contraseña de base de datos y guárdala en
   un lugar seguro (no la necesitarás para esta app, pero es buena práctica
   guardarla).
2. Dentro de tu proyecto, en el menú de la izquierda, busca **"SQL Editor"**.
3. Haz clic en **"New query"** (nueva consulta).
4. Abre el archivo `supabase/01_schema.sql` de esta carpeta, copia **todo**
   su contenido, y pégalo en el editor de Supabase.
5. Presiona el botón **"Run"** (ejecutar). Debería decir "Success" al
   terminar. Esto crea todas las tablas, la seguridad y los mecanismos
   automáticos. **Solo se hace una vez.**

### Crear tu primer usuario (administrador)

6. En el menú de la izquierda, ve a **Authentication → Users**.
7. Haz clic en **"Add user"** (agregar usuario).
8. Escribe tu correo electrónico y una contraseña. Si aparece la opción
   **"Auto Confirm User"**, actívala (así no tienes que confirmar el correo).
9. Guarda el usuario.
10. Vuelve al **SQL Editor**, abre una consulta nueva.
11. Abre el archivo `supabase/02_hacer_administrador.sql`, cambia
    `correo@ejemplo.com` por el correo que usaste en el paso 8 (y opcionalmente
    tu nombre), pégalo completo en el editor y presiona **"Run"**.
12. Listo — ese usuario ya es tu Administrador.

> Desde este momento, **no necesitas volver a tocar Supabase para crear más
> usuarios**. Los empleados, vendedores o residentes de obra que necesites
> los creas desde dentro de la aplicación, en la pantalla **"Usuarios"**.

### ¿Necesito crear algún "bucket" (almacenamiento de archivos)?

No. Esta versión de la aplicación no sube fotos ni archivos todavía, así
que no necesitas crear ningún bucket en Supabase. Si más adelante quieres
agregar fotos de avance de obra o comprobantes escaneados, se puede agregar
esa función y en ese momento sí se creará un bucket.

---

## Parte 2 — Conectar la aplicación a tu proyecto de Supabase

Solo necesitas dos valores, guardados en un archivo llamado `.env`.

1. En la carpeta del proyecto, busca el archivo `.env.example`. Haz una copia
   de ese archivo y renombra la copia a `.env` (sin ".example"). Este nuevo
   archivo es el que vas a editar; el `.env.example` queda solo como
   referencia y no lo toques.
2. En Supabase, ve a **Project Settings** (ícono de engranaje) → **Data API**.
   Ahí encontrarás tu **Project URL** (algo como
   `https://abcdefgh.supabase.co`).
3. En la misma sección de Settings, ve a **API Keys** y copia la clave
   marcada como **"anon"** o **"public"** (a veces aparece como
   "Publishable key"). Es una clave larga de texto — **no** copies la que
   dice "service_role" (esa nunca se usa aquí).
4. Abre el archivo `.env` y reemplaza los dos valores:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICA-ANON-AQUI
```

por los tuyos. Guarda el archivo. Eso es todo para usarlo en tu computadora.

> El archivo `.env` **nunca se sube a Git** (ya está excluido) y no debes
> compartirlo con nadie, porque cada persona que publique este proyecto en
> Netlify pondrá ahí su propia conexión. En Netlify, estos mismos dos
> valores se configuran de otra forma — ver la Parte 3.

---

## Parte 3 — Publicar en Netlify

### Opción A: arrastrar y soltar (la más simple)

1. Asegúrate de haber creado tu archivo `.env` como se explicó en la Parte 2
   (la compilación de tu computadora usará esos valores).
2. En tu computadora, abre una terminal dentro de la carpeta del proyecto y
   ejecuta:
   ```
   npm install
   npm run build
   ```
   Esto crea una carpeta llamada `dist` con la aplicación ya lista (y tu
   conexión a Supabase ya incluida dentro).
3. Entra a [app.netlify.com](https://app.netlify.com) e inicia sesión.
4. En la pantalla principal, busca la zona que dice algo como
   "Drag and drop your site output folder here" (arrastra aquí la carpeta
   de tu sitio) y arrastra la carpeta `dist`.
5. En un par de segundos tu sitio queda publicado con una dirección tipo
   `https://algun-nombre.netlify.app`.

### Opción B: conectar tu repositorio de Git (recomendada a futuro)

1. Sube esta carpeta a un repositorio en GitHub (o GitLab/Bitbucket). El
   archivo `.env` no se subirá (está excluido a propósito), así que Netlify
   no conocerá tu conexión todavía — eso se resuelve en el siguiente paso.
2. En Netlify, haz clic en **"Add new site" → "Import an existing project"**.
3. Elige tu repositorio.
4. Netlify detectará automáticamente:
   - Build command: `npm run build`
   - Publish directory: `dist`
   (ya están definidos también en el archivo `netlify.toml` incluido).
5. Antes de publicar (o después, en **Site settings → Environment
   variables**), agrega estas dos variables con tus propios valores:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Haz clic en **"Deploy"**. Cada vez que subas cambios a tu repositorio,
   Netlify volverá a publicar la app sola, usando esas mismas variables.

---

## Parte 4 — Usar la aplicación

1. Entra a la dirección que te dio Netlify.
2. Inicia sesión con el correo y la contraseña que creaste como
   administrador (Parte 1).
3. Ve a **"Proyectos" → "Nuevo proyecto"** para crear tu primera obra.
4. Ve a **"Usuarios" → "Nuevo usuario"** para crear las cuentas de tus
   residentes de obra o cualquier otro empleado. Ahí eliges su nombre,
   correo, contraseña y si será **Administrador** o **Residente**.
5. Al crear o editar un proyecto, en el campo **"Usuario residente"** puedes
   elegir a la persona que ya creaste — así esa persona, al iniciar sesión,
   verá únicamente ese proyecto.

---

## Preguntas frecuentes

**¿Un residente puede ver los proyectos de otros residentes?**
No. Cada residente solo ve el proyecto (o proyectos) donde lo hayas
asignado como "Usuario residente".

**¿Qué pasa si creo un proyecto sin asignar un usuario residente?**
El proyecto solo será visible para los administradores hasta que le
asignes uno.

**¿Puedo cambiar la contraseña de un usuario ya creado?**
Desde la app todavía no (por seguridad, eso requiere un permiso especial
de Supabase que esta versión no usa). Si alguien olvida su contraseña, lo
más simple es crear un nuevo usuario, o pedirle soporte técnico para
restablecerla desde el panel de Supabase (Authentication → Users → el
usuario → "Send password recovery" o "Reset password").

**¿Qué pasa si pierdo la conexión a internet mientras uso la app?**
La aplicación te avisa con una barra cuando no hay conexión. Los datos se
guardan en Supabase, así que necesitas conexión a internet para
guardarlos — no es una app que funcione completamente sin internet.

---

## Estructura del proyecto (para referencia)

```
control-de-obras/
├── .env.example                    ← cópialo y renómbralo a .env
├── supabase/
│   ├── 01_schema.sql               ← pega esto UNA vez en Supabase
│   └── 02_hacer_administrador.sql  ← pega esto para crear tu admin
├── src/
│   ├── lib/
│   │   ├── supabaseConfig.js       ← lee las variables del .env
│   │   ├── supabaseClient.js
│   │   └── api.js
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── UsersView.jsx
│   │   └── ControlDeObras.jsx      ← toda la interfaz de la app
│   ├── App.jsx
│   └── main.jsx
├── netlify.toml
└── package.json
```
