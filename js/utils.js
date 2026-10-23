// utils.js — helpers de DOM, fecha y estadísticas
'use strict';

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }
function dbUid() { return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${uid('db')}-0000-0000-0000-000000000000`; }

// --- Fechas ---
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = ((h + 11) % 12) + 1;
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} · ${h12}:${m} ${period}`;
}

function formatDateShort(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

function todayWeekdayName() {
  const map = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return map[new Date().getDay()];
}

function daysBetween(isoA, isoB) {
  const a = new Date(isoA), b = new Date(isoB);
  return Math.round((b - a) / 86400000);
}

function localDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateInputToLocalISO(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toISOString();
}

// --- Formato ---
function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}
function formatKwh(n) { return `${Number(n).toFixed(1)} kWh`; }
function formatKm(n) { return `${Number(n).toFixed(1)} km`; }
function formatRatingStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// --- Estadísticas ---
function sum(arr, fn) { return arr.reduce((acc, x) => acc + (fn ? fn(x) : x), 0); }
function avg(arr, fn) { return arr.length ? sum(arr, fn) / arr.length : 0; }

function co2AvoidedFromKwh(kwh) {
  // Estimación de CO2 evitado por kWh frente a un vehículo de combustión.
  return Math.round(kwh * 0.31 * 10) / 10;
}

function groupByWeek(activities) {
  // Devuelve un mapa { 'YYYY-Www': totalKwh } ordenado cronológicamente
  const map = new Map();
  for (const a of activities) {
    const d = new Date(a.date);
    const week = isoWeekLabel(d);
    map.set(week, (map.get(week) || 0) + a.kwh);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function isoWeekLabel(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
}

function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// --- Foto de perfil ---
// Recorta al centro en cuadrado y reduce a 256x256 JPEG (la foto pesa ~20-40 KB)
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Selecciona un archivo de imagen.'));
    if (file.size > 8 * 1024 * 1024) return reject(new Error('La imagen no puede superar 8 MB.'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.')), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

// Foto del usuario o, si no tiene, círculo con sus iniciales
function avatarNode(user, size = 'md') {
  const name = user?.name || '?';
  const cls = `avatar avatar--${size}`;
  if (user?.avatarUrl) return el('img', { class: cls, src: user.avatarUrl, alt: `Foto de ${name}` });
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return el('span', { class: cls, 'aria-hidden': 'true' }, initials);
}

async function changeAvatar(file) {
  try {
    showToast('Subiendo foto…');
    const blob = await resizeImage(file);
    const url = await SupabaseAPI.uploadAvatar(blob);
    await SupabaseAPI.saveAvatarUrl(url);
    const userId = currentUser().id;
    setData(data => { data.users.find(u => u.id === userId).avatarUrl = url; });
    showToast('Foto de perfil actualizada.', 'teal');
  } catch (err) {
    showToast(err.message || 'No se pudo actualizar la foto.', 'danger');
  }
}

// --- Teléfono ---
// Devuelve el número normalizado (+57XXXXXXXXXX) o null si no es válido
function normalizePhone(value) {
  const raw = String(value || '').replace(/[\s\-().]/g, '');
  if (/^3\d{9}$/.test(raw)) return `+57${raw}`;
  if (/^\+?573\d{9}$/.test(raw)) return `+${raw.replace('+', '')}`;
  if (/^\+\d{8,15}$/.test(raw)) return raw; // otros países
  return null;
}

function formatPhone(phone) {
  const m = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(phone || '');
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : (phone || '');
}
