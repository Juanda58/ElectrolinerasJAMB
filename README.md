#  Electrolineras JAMB

Aplicación web para localizar, planear y gestionar la carga de vehículos eléctricos en una red de electrolineras. Permite a los usuarios finales encontrar estaciones cercanas, reservar turno y conector con pago anticipado, seguir su historial y progreso de carga, y administrar su perfil/vehículo. Incluye además un **panel administrativo** para operar la red: gestión de estaciones, aprobación de reservas, usuarios y auditoría.

> Proyecto construido en **JavaScript Vanilla** (sin frameworks ni bundlers) con persistencia en **Supabase**.

---

## Tabla de contenido

- [Stack y librerías](#stack-y-librerías)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura de la aplicación](#arquitectura-de-la-aplicación)
- [Modelo de datos (Supabase)](#modelo-de-datos-supabase)
- [Roles y flujos principales](#roles-y-flujos-principales)
- [Seguridad](#seguridad)
- [Mejoras futuras](#mejoras-futuras)
- [Licencia](#licencia)

---

## Stack y librerías

El proyecto **no usa frameworks de frontend** (React, Vue, etc.) ni herramientas de build (Webpack, Vite). Es HTML + CSS + JavaScript puro, cargado directamente por el navegador mediante `<script>` tags clásicos, lo que simplifica el despliegue (basta con servir archivos estáticos) a costa de no tener módulos ES, tree-shaking ni bundling.

| Librería / servicio | Uso en el proyecto | Notas |
|---|---|---|
| **JavaScript Vanilla (ES2020+)** | Toda la lógica de UI, estado y dominio | Sin frameworks; el "motor de render" (`el()`, `$()`, `clear()`) está escrito a mano en `utils.js`. |
| **Supabase** (Auth + PostgREST) | Autenticación de usuarios y persistencia remota de datos | Se consume vía `fetch()` directo a la API REST (`/auth/v1`, `/rest/v1`), **no** se usa el SDK oficial `@supabase/supabase-js`. Ver `js/supabase-api.js`. |
| **Google Fonts** (`Space Grotesk`, `Inter`) | Tipografía de la interfaz | Cargada por `<link>` en `index.html`, sin dependencia local. |
| **SVG inline** | Iconografía | Set de íconos propios en `js/icons.js`, sin librerías externas (Font Awesome, Lucide, etc.). |
| **CSS puro** (`style.css`) | Estilos y sistema de diseño | Sin preprocesadores (Sass/Less) ni frameworks de utilidades (Tailwind). |

No hay `package.json` ni dependencias de `npm`: el proyecto es 100% estático y puede servirse desde cualquier servidor HTTP simple.

---

## Requisitos previos

- Un navegador moderno con soporte de `fetch`, `crypto.randomUUID` y `sessionStorage`.
- Un servidor HTTP estático (no funciona abriendo `index.html` con `file://` porque los `<script>` y `fetch` a Supabase requieren un origen HTTP).
- Una cuenta y proyecto en [Supabase](https://supabase.com) para la persistencia de datos y autenticación.

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Electorlinera

# 2. Servir el proyecto como archivos estáticos (elige una opción)
npx serve .
# o
python3 -m http.server 8080

# 3. Abrir en el navegador
http://localhost:8080
```

### Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta [`supabase/schema.sql`](./supabase/schema.sql) en el **SQL Editor** de Supabase para crear las tablas, tipos y políticas RLS.
3. Ejecuta [`supabase/seed.sql`](./supabase/seed.sql) para cargar las estaciones y datos semilla.
4. Crea los usuarios desde **Supabase Auth** (el `id` de `profiles` debe coincidir con el `id` de `auth.users`).
5. Promueve una cuenta a administrador:
   ```sql
   update public.profiles set role = 'admin', plan = 'Operador de red' where email = 'admin@jamb.com';
   ```
6. Copia la **Project URL** y la **anon public key** (Supabase → Project Settings → API) en [`js/supabase-config.js`](./js/supabase-config.js):
   ```js
   const SUPABASE_CONFIG = {
     url: 'https://TU-PROYECTO.supabase.co',
     anonKey: 'PEGA_AQUI_TU_ANON_PUBLIC_KEY',
   };
   ```

⚠️ **Nunca** pegues la clave `service_role` en este archivo: solo la `anon public key` debe vivir en el frontend. Más detalle en [`SUPABASE-MIGRACION.md`](./SUPABASE-MIGRACION.md).

---

## Estructura del proyecto

```
Electorlinera/
├── index.html                  # Punto de entrada; carga hojas de estilo, fuentes y todos los scripts en orden
├── style.css                   # Sistema de diseño completo de la aplicación (layout, componentes, temas)
├── SUPABASE-MIGRACION.md       # Guía de migración e instalación de Supabase
├── js/
│   ├── supabase-config.js      # Credenciales públicas de Supabase (URL + anon key)
│   ├── supabase-api.js         # Cliente HTTP hecho a mano contra la API REST/Auth de Supabase
│   ├── constants.js            # Enums, catálogos semilla, pestañas de navegación y textos globales
│   ├── utils.js                # Helpers de DOM (el, $, clear), fechas, formato y estadísticas
│   ├── icons.js                # Set de íconos SVG inline
│   ├── storage.js              # Capa de persistencia (delega en SupabaseAPI)
│   ├── state.js                # Estado global reactivo (store en memoria + init + acciones transversales)
│   ├── stations.js             # Lógica de dominio: catálogo de electrolineras y CRUD admin
│   ├── reservations.js         # Lógica de dominio: solicitudes, aprobación y ciclo de vida de reservas
│   ├── views/
│   │   ├── today.js            # Pestaña "Hoy": accesos rápidos, resumen del usuario o del admin
│   │   ├── plan.js             # Pestaña "Plan": plan semanal de carga por día
│   │   ├── progress.js         # Pestaña "Progreso": metas, racha e impacto (CO₂ evitado)
│   │   ├── library.js          # Pestaña "Biblioteca": catálogo/búsqueda de electrolineras
│   │   ├── history.js          # Pestaña "Historial": sesiones pasadas y cumplimiento del plan
│   │   ├── reservations.js     # Pestaña "Reservas": solicitud de turno/conector + panel admin
│   │   ├── charging.js         # Flujo guiado de carga paso a paso (selección → confirmación → en curso → resumen)
│   │   ├── garage.js           # Pestaña "Mi garaje": perfil, vehículo, metas y favoritos
│   │   └── admin.js            # Panel administrativo: dashboard, estaciones, reservas, usuarios, auditoría
│   └── app.js                  # Shell de la app: enrutamiento de pestañas, autenticación, modal, arranque
└── supabase/
    ├── schema.sql               # Definición de tablas, tipos, relaciones y políticas RLS
    └── seed.sql                 # Datos semilla (estaciones, conectores, patrocinadores)
```

### Detalle de carpetas

- **`js/` (raíz):** contiene la infraestructura transversal de la aplicación — configuración, cliente de datos, utilidades, íconos, estado global y lógica de dominio que no pertenece a ninguna vista en particular (estaciones y reservas).
- **`js/views/`:** una vista por cada pestaña de navegación (`TABS` en `constants.js`) más el flujo especial de carga guiada y el panel de administración. Cada archivo expone un objeto con al menos un método `render(container)` que dibuja esa pantalla dentro del `#view-container`.
- **`supabase/`:** todo lo necesario para aprovisionar el backend — esquema relacional, tipos enumerados, relaciones con llaves foráneas y datos de ejemplo para poblar la demo.

---

## Arquitectura de la aplicación

La aplicación sigue un patrón **estado central + render por pestaña**, sin virtual DOM:

1. **`state.js`** mantiene un único objeto `state` con dos ramas: `state.data` (datos de dominio: usuarios, estaciones, reservas, actividad, etc.) y `state.ui` (pestaña activa, modo de autenticación, toasts, modales). `init()` carga los datos remotos y repara datos legados si es necesario.
2. **Mutaciones:** toda modificación pasa por `setData(mutator)` o `setUI(patch)`, que actualizan el estado, lo persisten (`Storage.save`) y notifican a los "listeners" suscritos (`notify()`), disparando un re-render completo (`renderRoot`).
3. **Render:** `utils.js` expone un mini "framework" de creación de nodos (`el(tag, attrs, children)`) usado por todas las vistas para construir el DOM de forma declarativa, sin plantillas ni JSX.
4. **Navegación:** `app.js` decide qué vista mostrar según `state.ui.tab`, usando los mapas `VIEWS` (usuario) y `ADMIN_VIEWS` (administrador) definidos en el propio `app.js`.
5. **Persistencia:** `storage.js` es una capa fina que delega en `supabase-api.js`, el cual traduce el modelo de la app (camelCase, anidado) hacia/desde las tablas planas de Postgres (snake_case) mediante los métodos `xToRow` / `xToView`.
6. **Actualizaciones en vivo:** `simulateLiveUpdate()` en `state.js` simula cambios de disponibilidad en tiempo real para dar sensación de red activa (pensado para reemplazarse por *Realtime* de Supabase, ver mejoras futuras).

---

## Modelo de datos (Supabase)

El esquema (`supabase/schema.sql`) define las siguientes tablas principales, todas con Row Level Security (RLS):

| Tabla | Propósito |
|---|---|
| `profiles` | Perfil de usuario vinculado a `auth.users` (rol, vehículo, estadísticas, preferencias) |
| `stations` | Catálogo de electrolineras (ubicación, estado, tarifa, ocupación) |
| `station_connectors` | Conectores por estación (tipo, potencia, disponibilidad) |
| `reservations` | Reservas de turno/conector con pago anticipado y estado |
| `payments` | Registro de pagos asociados a una reserva |
| `charging_sessions` | Sesiones de carga (inicio, fin, kWh, costo) |
| `activity` | Historial de actividad de carga por usuario |
| `audit_logs` | Trazabilidad de acciones administrativas |

La capa `SupabaseAPI` en el frontend solo usa la **anon key** y confía en las políticas RLS (incluida la función `public.is_admin()`) para restringir qué puede leer o escribir cada rol.

---

## Roles y flujos principales

**Usuario (`usuario`)**
- Consultar el catálogo de electrolineras y filtrar por estado/conector (`Biblioteca`).
- Reservar un turno y conector con pago simulado (`Reservas`).
- Iniciar una carga guiada paso a paso (`Hoy` → `charging.js`).
- Planear su semana de carga (`Plan`) y revisar su cumplimiento (`Historial`).
- Ver metas, racha y CO₂ evitado (`Progreso`).
- Administrar su vehículo, preferencias y estaciones favoritas (`Mi garaje`).

**Administrador (`admin`)**
- Dashboard operativo con métricas de red, ocupación y facturación (`admin-dashboard`).
- CRUD completo de estaciones y conectores (`admin-estaciones`).
- Aprobar/rechazar reservas y registrar incumplimientos con multa (`admin-reservas`).
- Gestión de usuarios registrados (`admin-usuarios`).
- Auditoría de acciones administrativas (`admin-auditoria`).

---

## Seguridad

- La app usa exclusivamente la **anon public key** de Supabase en el cliente; nunca la `service_role key`.
- La autorización de operaciones sensibles (crear/editar estaciones, aprobar reservas, ver auditoría) se resuelve en el backend mediante **RLS**, no confiando en validaciones del frontend.
- Las contraseñas nunca se leen ni se guardan en el estado de la app: la autenticación se delega enteramente en Supabase Auth.

---

## Mejoras futuras

**Arquitectura y calidad de código**
- Migrar de `<script>` globales a **módulos ES** (`import`/`export`) o introducir un bundler ligero (Vite/esbuild) para mejorar el mantenimiento y permitir *code splitting*.
- Adoptar el **SDK oficial `@supabase/supabase-js`** en lugar de `fetch` manual, para obtener manejo de sesión, refresco de tokens y suscripciones en tiempo real "de fábrica".
- Incorporar TypeScript o JSDoc tipado para reducir errores en el mapeo `row ↔ view` entre Supabase y el estado de la app.
- Añadir pruebas automatizadas (unitarias para `utils.js`/`reservations.js`/`stations.js` y end-to-end con Playwright/Cypress para los flujos de reserva y carga).
- Configurar linting y formateo (ESLint + Prettier) y un pipeline de CI (GitHub Actions) que corra pruebas y linting en cada PR.

**Funcionalidad**
- Reemplazar `simulateLiveUpdate()` (aleatorio) por **Supabase Realtime**, suscribiéndose a cambios reales en `stations` y `station_connectors`.
- Integrar un mapa real (Mapbox/Google Maps/Leaflet) para geolocalización y cálculo de distancia real en lugar del campo estático `distanceKm`.
- Conectar una pasarela de pagos real (Wompi, PayU, Stripe) en lugar de la simulación de `paymentStatus`.
- Notificaciones push/email cuando una reserva es aprobada, rechazada o está por vencer.
- Internacionalización (i18n) para soportar otros idiomas además de español.
- Soporte offline / PWA (Service Worker + manifest) para consulta del catálogo sin conexión.
- Panel de reportes/exportación (CSV/Excel) para el administrador sobre ocupación, ingresos y auditoría.

**Seguridad y operación**
- Rate limiting y validación de entrada más estricta en las escrituras hacia Supabase (actualmente gran parte de la validación vive solo en el cliente).
- Roles adicionales (p. ej. operador de estación) con permisos más granulares que "usuario" y "admin".
- Monitoreo y logging estructurado (Sentry o similar) para errores en producción.
- Versionado de esquema y migraciones formales (Supabase CLI / `supabase migration`) en lugar de un único `schema.sql`.

---

## Licencia

Este proyecto no incluye actualmente un archivo de licencia. Se recomienda añadir uno (por ejemplo, MIT) antes de publicar el repositorio como código abierto.
