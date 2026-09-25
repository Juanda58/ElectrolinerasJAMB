-- =====================================================================
-- Esquema de base de datos: Sistema de Electrolineras
-- Generado a partir del diagrama de clases Electrolinera.drawio
-- Motor: PostgreSQL (compatible con Supabase)
-- =====================================================================

-- Extensión para generar UUIDs si prefieres usarlos en vez de SERIAL
-- create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. USUARIO
-- =====================================================================
create table if not exists usuarios (
    id_usuario      serial primary key,
    nombre          varchar(150) not null,
    cedula          varchar(20)  not null unique,
    email           varchar(150) not null unique,
    contrasena_hash text         not null, -- guarda siempre el hash, nunca texto plano
    numero          varchar(20),
    creado_en       timestamptz  not null default now()
);

-- =====================================================================
-- 2. VEHICULO  (N vehículos por 1 usuario)
-- =====================================================================
create table if not exists vehiculos (
    id_vehiculo             serial primary key,
    id_usuario              integer not null references usuarios(id_usuario) on delete cascade,
    marca                   varchar(80) not null,
    modelo                  varchar(80) not null,
    tipo_conector           varchar(50) not null,
    capacidad_bateria_kwh   double precision not null check (capacidad_bateria_kwh > 0),
    potencia_carga_max_kw   double precision not null check (potencia_carga_max_kw > 0),
    creado_en               timestamptz not null default now()
);

create index if not exists idx_vehiculos_usuario on vehiculos(id_usuario);

-- =====================================================================
-- 3. ELECTROLINERAS
-- =====================================================================
create table if not exists electrolineras (
    id_electrolinera integer generated always as identity primary key,
    nombre           varchar(150) not null,
    marca_operador   varchar(150),
    latitud          double precision not null check (latitud between -90 and 90),
    longitud         double precision not null check (longitud between -180 and 180),
    direccion        varchar(255)
);

create index if not exists idx_electrolineras_ubicacion on electrolineras(latitud, longitud);

-- =====================================================================
-- 4. PUNTO DE CARGA  (N puntos por 1 electrolinera)
-- =====================================================================
create table if not exists puntos_carga (
    id_punto         serial primary key,
    id_electrolinera integer not null references electrolineras(id_electrolinera) on delete cascade,
    tipo_conector    varchar(50) not null,
    potencia_kw      double precision not null check (potencia_kw > 0),
    estado           varchar(30) not null default 'disponible'
                      check (estado in ('disponible','ocupado','fuera_servicio','mantenimiento')),
    precio_por_kwh   numeric(10,2) not null check (precio_por_kwh >= 0)
);

create index if not exists idx_puntos_electrolinera on puntos_carga(id_electrolinera);

-- =====================================================================
-- 5. RESERVA  (N reservas por 1 usuario y por 1 punto de carga)
-- =====================================================================
create table if not exists reservas (
    id_reserva              serial primary key,
    id_usuario              integer not null references usuarios(id_usuario) on delete cascade,
    id_punto                integer not null references puntos_carga(id_punto) on delete cascade,
    fecha_hora_inicio       timestamptz not null,
    duracion_estimada_min   integer not null check (duracion_estimada_min > 0),
    fecha_hora_fin          timestamptz,
    estado                  varchar(30) not null default 'pendiente'
                             check (estado in ('pendiente','confirmada','en_curso','finalizada','cancelada'))
);

create index if not exists idx_reservas_usuario on reservas(id_usuario);
create index if not exists idx_reservas_punto on reservas(id_punto);
create index if not exists idx_reservas_horario on reservas(fecha_hora_inicio, fecha_hora_fin);

-- =====================================================================
-- 6. PAGO  (1 pago por 1 reserva)
-- =====================================================================
create table if not exists pagos (
    id_pago       serial primary key,
    id_reserva    integer not null unique references reservas(id_reserva) on delete cascade,
    monto         numeric(10,2) not null check (monto >= 0),
    metodo_pago   varchar(50) not null,
    estado_pago   varchar(30) not null default 'pendiente'
                   check (estado_pago in ('pendiente','aprobado','rechazado','reembolsado')),
    fecha_pago    timestamptz
);

-- =====================================================================
-- (Opcional pero recomendado en Supabase) Row Level Security
-- Ajusta las políticas según cómo autentiques a tus usuarios.
-- Ejemplo básico: cada usuario solo ve/edita sus propios datos.
-- =====================================================================
alter table usuarios       enable row level security;
alter table vehiculos      enable row level security;
alter table reservas       enable row level security;
alter table pagos          enable row level security;
alter table electrolineras enable row level security;
alter table puntos_carga   enable row level security;

-- Electrolineras y puntos de carga son datos públicos de lectura
create policy "Lectura publica electrolineras" on electrolineras
    for select using (true);

create policy "Lectura publica puntos_carga" on puntos_carga
    for select using (true);

-- Nota: si usas Supabase Auth, reemplaza "id_usuario" por una columna
-- uuid que referencie auth.users(id), y usa auth.uid() en las políticas,
-- por ejemplo:
-- create policy "Usuario ve sus propios datos" on usuarios
--     for select using (auth.uid() = auth_id);
