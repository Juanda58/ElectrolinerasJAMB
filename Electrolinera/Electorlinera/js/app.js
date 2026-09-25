// app.js — render raíz, login, navegación, shell de la app
'use strict';

const VIEWS = {
  hoy: TodayView, plan: PlanView, progreso: ProgressView,
  biblioteca: LibraryView, historial: HistoryView, reservas: ReservationsView,
  garaje: GarageView,
};

// --- Modal genérico reutilizado por las vistas ---
const Modal = {
  open({ title, body, actions = [] }) {
    this.close();
    const overlay = el('div', { class: 'modal-overlay', id: 'modal-overlay' });
    const dialog = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    dialog.appendChild(el('div', { class: 'modal__header' }, [
      el('h2', {}, title),
      el('button', { class: 'btn btn--icon', 'aria-label': 'Cerrar ventana', onclick: () => this.close() }, icon('x')),
    ]));
    dialog.appendChild(el('div', { class: 'modal__body' }, body));
    if (actions.length) {
      dialog.appendChild(el('div', { class: 'modal__actions' }, actions.map(a =>
        el('button', { class: `btn btn--${a.variant || 'ghost'}`, onclick: a.onClick }, a.label)
      )));
    }
    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
    document.body.appendChild(overlay);
    dialog.querySelector('button')?.focus();
  },
  confirm({ title, message, onConfirm }) {
    this.open({
      title,
      body: el('p', {}, message),
      actions: [
        { label: 'Cancelar', variant: 'ghost', onClick: () => this.close() },
        { label: 'Eliminar', variant: 'danger', onClick: () => { onConfirm(); this.close(); } },
      ],
    });
  },
  close() {
    const overlay = $('#modal-overlay');
    if (overlay) overlay.remove();
  },
};

// --- Raíz de la aplicación ---
function renderRoot() {
  const root = $('#root');
  clear(root);
  const user = currentUser();
  if (!user) root.appendChild(renderAuth());
  else root.appendChild(renderShell(user));
  renderToast();
}

function renderToast() {
  const existing = $('#toast'); if (existing) existing.remove();
  if (!state.ui.toast) return;
  const t = el('div', { id: 'toast', class: `toast toast--${state.ui.toast.tone}` }, state.ui.toast.message);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-visible'));
}

// --- Autenticación (demo, sin backend) ---
function renderAuth() {
  const wrap = el('div', { class: 'auth-layout' });
  const panel = el('div', { class: 'auth-layout__panel' }, [
    el('div', { class: 'auth-layout__logo' }, [icon('bolt'), el('span', {}, APP_NAME)]),
    el('h2', {}, 'Carga eléctrica, sin adivinar.'),
    el('p', {}, 'Encuentra electrolineras cercanas, revisa sus conectores y su disponibilidad antes de salir.'),
    el('p', { class: 'muted small' }, 'Fase 1 — interfaz navegable con datos DEMO. Sin pagos ni geolocalización real.'),
  ]);
  const content = el('div', { class: 'auth-layout__content' });
  content.appendChild(state.ui.authMode === 'login' ? loginForm() : registerForm());
  wrap.append(panel, content);
  return wrap;
}

function loginForm() {
  const card = el('div', { class: 'auth-card' });
  card.appendChild(el('h1', {}, 'Inicia sesión'));
  card.appendChild(el('p', { class: 'muted' }, 'Entra a tu cuenta para ver tu historial de carga y tus electrolineras favoritas.'));

  const form = el('form', { class: 'form' });
  const email = el('input', { type: 'email', name: 'email', required: true, placeholder: 'tu@correo.com', value: 'laura@demo.com' });
  const password = el('input', { type: 'password', name: 'password', required: true, placeholder: '••••••••', value: '1234' });
  const remember = el('input', { type: 'checkbox', name: 'remember', checked: 'checked' });
  const error = el('p', { class: 'form-error', style: 'display:none' });

  form.append(
    el('label', {}, ['Correo electrónico', email]),
    el('label', {}, ['Contraseña', password]),
    el('label', { class: 'checkbox-label' }, [remember, ' Recordarme']),
    error,
    el('button', { class: 'btn btn--primary btn--block', type: 'submit' }, 'Iniciar sesión'),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = state.data.users.find(u => u.email.toLowerCase() === email.value.trim().toLowerCase() && u.password === password.value);
    if (!user) { error.textContent = 'Correo o contraseña incorrectos.'; error.style.display = 'block'; return; }
    setData(d => { d.session = user.id; });
    setUI({ tab: 'hoy' });
  });
  card.appendChild(form);

  card.appendChild(el('p', { class: 'auth-switch' }, [
    '¿No tienes cuenta? ',
    el('button', { class: 'link-btn', onclick: () => setUI({ authMode: 'register' }) }, 'Regístrate'),
  ]));
  card.appendChild(el('p', { class: 'muted small' }, 'Demo: laura@demo.com / 1234 · admin: admin@jamb.demo / admin1234'));
  return card;
}

function registerForm() {
  const card = el('div', { class: 'auth-card' });
  card.appendChild(el('h1', {}, 'Crea tu cuenta'));
  card.appendChild(el('p', { class: 'muted' }, 'Regístrate con tu correo y cuéntanos qué vehículo eléctrico conduces.'));

  const form = el('form', { class: 'form' });
  const name = el('input', { name: 'name', required: true, placeholder: 'Tu nombre' });
  const email = el('input', { type: 'email', name: 'email', required: true, placeholder: 'tu@correo.com' });
  const password = el('input', { type: 'password', name: 'password', required: true, minlength: '8', placeholder: 'Mínimo 8 caracteres' });
  const vehicleModel = el('input', { name: 'model', placeholder: 'Ej. Renault Kwid E-Tech' });
  const terms = el('input', { type: 'checkbox', name: 'terms', required: true });
  const error = el('p', { class: 'form-error', style: 'display:none' });

  form.append(
    el('label', {}, ['Nombre completo', name]),
    el('label', {}, ['Correo electrónico', email]),
    el('label', {}, ['Contraseña', password]),
    el('label', {}, ['Vehículo eléctrico', vehicleModel]),
    el('label', { class: 'checkbox-label' }, [terms, ' Acepto los términos y condiciones']),
    error,
    el('button', { class: 'btn btn--primary btn--block', type: 'submit' }, 'Crear cuenta gratis'),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateEmail(email.value)) { error.textContent = 'Ingresa un correo válido.'; error.style.display = 'block'; return; }
    if (state.data.users.some(u => u.email.toLowerCase() === email.value.toLowerCase())) {
      error.textContent = 'Ya existe una cuenta con ese correo.'; error.style.display = 'block'; return;
    }
    const newUser = {
      id: uid('u'), name: name.value, email: email.value, password: password.value, role: ROLES.USER,
      plan: 'JAMB Básico',
      vehicle: { brand: '', model: vehicleModel.value || 'Sin especificar', connector: 'Tipo 2 (AC)', batteryCapacityKwh: 40 },
      stats: { totalCharges: 0, kwhConsumed: 0, co2AvoidedKg: 0, favoriteStationId: null },
    };
    setData(d => { d.users.push(newUser); d.session = newUser.id; });
    setUI({ tab: 'hoy' });
  });
  card.appendChild(form);

  card.appendChild(el('p', { class: 'auth-switch' }, [
    '¿Ya tienes cuenta? ',
    el('button', { class: 'link-btn', onclick: () => setUI({ authMode: 'login' }) }, 'Inicia sesión'),
  ]));
  return card;
}

// --- Shell principal ---
function renderShell(user) {
  const shell = el('div', { class: 'app-shell' });
  shell.appendChild(renderSidebar(user));

  const main = el('main', { class: 'app-shell__main' });
  main.appendChild(renderTopbar(user));
  const viewContainer = el('div', { id: 'view-container', class: 'view-container' });
  main.appendChild(viewContainer);
  shell.appendChild(main);

  renderActiveView(viewContainer);
  return shell;
}

function renderSidebar(user) {
  const tabs = isAdmin() ? TABS.filter(t => !['plan', 'progreso', 'garaje'].includes(t.id)) : TABS;
  const nav = el('nav', { class: 'app-shell__nav', 'aria-label': 'Aplicación' },
    el('ul', {}, tabs.map(t => el('li', {}, [
      el('button', {
        class: `nav-link ${state.ui.tab === t.id ? 'is-active' : ''}`,
        onclick: () => { if (state.ui.tab === '__charging__') ChargingView.reset(); $('.app-shell').classList.remove('nav-open'); setUI({ tab: t.id, chargingStationId: null }); },
      }, [el('span', { html: ICONS[t.icon] }), t.label]),
    ])))
  );
  return el('aside', { class: 'app-shell__sidebar' }, [
    el('div', { class: 'app-shell__logo' }, [icon('bolt'), el('span', {}, APP_NAME)]),
    nav,
    el('div', { class: 'app-shell__user' }, [
      el('div', { class: 'app-shell__avatar' }, user.name.charAt(0)),
      el('div', {}, [el('p', { class: 'app-shell__user-name' }, user.name), el('p', { class: 'app-shell__user-plan' }, user.plan)]),
    ]),
    el('button', { class: 'btn btn--ghost btn--small app-shell__logout', onclick: logout }, [icon('logout'), ' Cerrar sesión']),
  ]);
}

function renderTopbar(user) {
  const currentTab = TABS.find(tab => tab.id === state.ui.tab);
  return el('header', { class: 'app-shell__topbar' }, [
    el('button', { class: 'app-shell__menu-toggle', 'aria-label': 'Abrir menú', 'aria-expanded': 'false', onclick: (e) => { const shell = $('.app-shell'); const open = shell.classList.toggle('nav-open'); e.currentTarget.setAttribute('aria-expanded', String(open)); } }, [el('span', { html: ICONS.menu })]),
    el('div', { class: 'app-shell__topbar-context' }, [
      el('span', { class: 'topbar-context__section' }, user.role === ROLES.ADMIN ? 'Panel de administración' : (currentTab ? currentTab.label : 'Mi cuenta')),
      el('span', { class: 'topbar-context__status' }, [el('span', { class: 'live-dot' }), 'Red operativa']),
    ]),
    el('button', { class: 'topbar-notifications', 'aria-label': 'Ver notificaciones', onclick: openNotifications }, [icon('bell'), unreadNotifications().length ? el('span', { class: 'notification-count' }, String(unreadNotifications().length)) : null]),
  ]);
}

function renderActiveView(container) {
  if (state.ui.tab === '__charging__') { ChargingView.render(container); return; }
  const view = VIEWS[state.ui.tab] || TodayView;
  view.render(container);
}

function logout() {
  ChargingView.reset();
  setData(d => { d.session = null; });
  setUI({ tab: 'hoy', authMode: 'login' });
}

// --- Arranque ---
document.addEventListener('DOMContentLoaded', () => {
  init();
  subscribe(renderRoot);
  renderRoot();
  setInterval(simulateLiveUpdate, 12000);
});

function openNotifications() {
  const notifications = state.data.notifications || [];
  const body = el('div', { class: 'notification-list' }, notifications.length ? notifications.map(notification => el('button', { class: `notification-item ${notification.read ? '' : 'is-unread'}`, onclick: () => { markNotificationsRead(); Modal.close(); } }, [
    el('span', { class: `notification-item__dot notification-item__dot--${notification.tone || 'ink'}` }),
    el('span', {}, [el('strong', {}, notification.title), el('small', { class: 'muted' }, `${notification.message} · ${formatDate(notification.date)}`)]),
  ])) : [el('p', { class: 'muted' }, 'No tienes notificaciones nuevas.')]);
  Modal.open({ title: 'Notificaciones', body, actions: [{ label: 'Marcar todas como leídas', variant: 'primary', onClick: () => { markNotificationsRead(); Modal.close(); } }] });
}
