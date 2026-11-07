// views/contact.js — ventanilla flotante de ayuda
'use strict';

const ContactView = {
    _open: false,

    toggle() {
    this._open = !this._open;
    const old = $('.help-widget');
    if (old) old.replaceWith(this.renderWidget(currentUser()));
    },

    renderWidget(user) {
    const wrap = el('div', { class: 'help-widget' });
    if (this._open) wrap.appendChild(this.panel(user));
    wrap.appendChild(el('button', {
        class: 'help-fab', type: 'button',
        'aria-label': this._open ? 'Cerrar ayuda' : 'Abrir ayuda',
        'aria-expanded': String(this._open),
        onclick: () => this.toggle(),
    }, [icon(this._open ? 'x' : 'chat'), this._open ? null : el('span', { class: 'help-fab__label' }, 'Ayuda')]));
    return wrap;
    },

    panel(user) {
    const message = `Hola, soy ${user.name} (${user.phone ? formatPhone(user.phone) : user.email}) y necesito ayuda con JAMB.`;
    const waUrl = `https://wa.me/${SUPPORT_CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
    const smsUrl = `sms:${SUPPORT_CONTACT.phone}?body=${encodeURIComponent(message)}`;

    const option = (cls, iconName, title, detail, href, external) => el('a', {
        class: `help-option help-option--${cls}`, href,
        target: external ? '_blank' : null, rel: external ? 'noopener' : null,
    }, [
        el('span', { class: 'help-option__icon' }, icon(iconName)),
        el('span', { class: 'help-option__text' }, [el('strong', {}, title), el('small', {}, detail)]),
    ]);

    return el('div', { class: 'help-panel card', role: 'dialog', 'aria-label': 'Ayuda' }, [
        el('div', { class: 'help-panel__header' }, [
        el('div', {}, [el('p', { class: 'eyebrow' }, 'Atención JAMB'), el('h3', {}, '¿Necesitas ayuda?')]),
        el('button', { class: 'btn btn--icon', type: 'button', 'aria-label': 'Cerrar', onclick: () => this.toggle() }, icon('x')),
        ]),
        el('p', { class: 'muted small' }, SUPPORT_CONTACT.hours),
        option('call', 'phone', 'Llamar', SUPPORT_CONTACT.display, `tel:${SUPPORT_CONTACT.phone}`, false),
        option('wa', 'whatsapp', 'WhatsApp', 'Chatea con un administrador', waUrl, true),
        option('sms', 'sms', 'Mensaje de texto', 'Envía un SMS', smsUrl, false),
        el('div', { class: 'help-panel__phone' }, [
        el('div', {}, [
            el('p', { class: 'eyebrow' }, 'Tu número de contacto'),
            el('strong', {}, user.phone ? formatPhone(user.phone) : 'Aún no registras un teléfono'),
        ]),
        el('button', { class: 'btn btn--ghost btn--small', type: 'button', onclick: () => GarageView.editPhone(user) }, user.phone ? 'Cambiar' : 'Agregar'),
        ]),
    ]);
    },
};