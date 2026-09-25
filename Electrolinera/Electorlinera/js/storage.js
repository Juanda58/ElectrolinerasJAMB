// storage.js — persistencia en localStorage + migraciones de datos viejos
'use strict';

const Storage = {
  load() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      let parsed = JSON.parse(raw);
      parsed = migrate(parsed);
      return parsed;
    } catch (e) {
      console.warn('No se pudo leer el estado guardado, se reinicia.', e);
      return null;
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ __v: STORAGE_VERSION, ...data }));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar en localStorage (¿modo privado o cuota llena?)', e);
      return false;
    }
  },

  reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  },
};

// Migraciones: cada función recibe el objeto y lo actualiza a la siguiente versión.
const MIGRATIONS = {
  // Ejemplo de una futura migración de v0 (sin campo __v) a v1:
  // 0: (data) => ({ ...data, users: (data.users || []).map(u => ({ ...u, plan: u.plan || 'JAMB Básico' })) }),
};

function migrate(data) {
  let version = data.__v || 0;
  while (MIGRATIONS[version]) {
    data = MIGRATIONS[version](data);
    version += 1;
  }
  data.__v = STORAGE_VERSION;
  return data;
}

function buildSeedData() {
  return {
    __v: STORAGE_VERSION,
    users: [SEED_USER, SEED_ADMIN],
    stations: JSON.parse(JSON.stringify(SEED_STATIONS)),
    activity: JSON.parse(JSON.stringify(SEED_ACTIVITY)),
    plan: JSON.parse(JSON.stringify(SEED_PLAN)),
    reservations: JSON.parse(JSON.stringify(SEED_RESERVATIONS)),
    weightLog: [], // en este dominio: bitácora de kWh consumidos por semana (ver progress.js)
    session: null, // id del usuario con sesión activa
  };
}
