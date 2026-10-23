// views/contact.js — contacto con los administradores
'use strict';

const ContactView = {
    render(container) {
        clear(container);
        const user = currentUser();
        const message = `Hola, soy ${user.name} (${user.phone ? formatPhone(user.phone) : user.email}) y necesito ayuda con JAMB.`;
        const waUrl = `https://wa.me/${SUPPORT_CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
        const smsUrl = `sms:${SUPPORT_CONTACT.phone}?body=${encodeURIComponent(message)}`;

        const wrap = el('div', { class: 'view view--contact' });
        wrap.appendChild(el('header', { class: 'view-header' }, [
        el('p', { class: 'eyebrow' }, 'Atención JAMB'),
        el('h1', {}, 'Contacta a un administrador'),
        el('p', { class: 'muted' }, 'Llama o escríbenos si tienes un problema con una estación, una reserva o un pago.'),
        ]));

    const option = (iconName, title, detail, button) => el('div', { class: 'card contact-card' }, [
        el('span', { class: 'stat-card__icon', html: ICONS[iconName] }),
        el('h3', {}, title),
        el('p', { class: 'muted small' }, detail),
        button,
    ]);

    wrap.appendChild(el('div', { class: 'contact-grid' }, [
    option('phone', 'Llamar', `Habla directamente con un administrador. ${SUPPORT_CONTACT.hours}`,
        el('a', { class: 'btn btn--primary btn--small', href: `tel:${SUPPORT_CONTACT.phone}` }, [icon('phone'), ` ${SUPPORT_CONTACT.display}`])),
    option('chat', 'WhatsApp', 'Escríbenos por WhatsApp con tus datos ya incluidos en el mensaje.',
        el('a', { class: 'btn btn--primary btn--small', href: waUrl, target: '_blank', rel: 'noopener' }, [icon('chat'), ' Abrir WhatsApp'])),
    option('chat', 'Mensaje de texto', 'Envía un SMS desde tu celular.',
        el('a', { class: 'btn btn--ghost btn--small', href: smsUrl }, [icon('chat'), ' Enviar SMS'])),
    ]));

    wrap.appendChild(el('div', { class: 'card contact-info' }, [
        el('div', {}, [
            el('p', { class: 'eyebrow' }, 'Tu número de contacto'),
            el('strong', {}, user.phone ? formatPhone(user.phone) : 'Aún no registras un teléfono'),
            el('p', { class: 'muted small' }, 'Los administradores pueden llamarte o escribirte a este número.'),
        ]),
        el('button', { class: 'btn btn--ghost btn--small', onclick: () => GarageView.editPhone(user) }, user.phone ? 'Cambiar' : 'Agregar'),
    ]));

    container.appendChild(wrap);
    },
};