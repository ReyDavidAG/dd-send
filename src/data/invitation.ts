// ═══════════════════════════════════════════════════════════════════════
//  ÚNICO ARCHIVO A EDITAR POR INVITACIÓN.
//  Copia el repo, cambia estos valores, y tienes una nueva invitación.
//  Los componentes solo leen de aquí — no hace falta tocarlos.
// ═══════════════════════════════════════════════════════════════════════

export const invitation = {
  // A quién va dirigida y de parte de quién
  to: 'Denisse',
  from: 'David',

  // Detalles de la cita
  event: {
    movie: 'ESCRIBE AQUÍ LA PELÍCULA',
    // Fecha/hora en ISO con zona horaria (centro de México, -06:00):
    datetime: '2026-07-20T20:00:00-06:00',
    datetimeLabel: 'Hoy · 8:00 PM',
    // Vemos la peli por Discord. Un grupo/DM de 3 no tiene link para compartir:
    // deja callLink en '' y solo se muestra el texto. Si es un servidor con
    // invitación, pega aquí su https://discord.gg/... y se vuelve un botón.
    callLink: '',
    callLabel: 'Nos vemos en Discord 🎧',
  },

  // Fotos (colócalas en public/images/). Rutas relativas, sin dominio.
  photos: ['images/foto-1.jpeg', 'images/foto-2.jpeg', 'images/foto-3.jpeg'],

  // Textos personalizados
  messages: {
    tapToOpen: 'Toca para abrir',
    greeting: 'Para ti, Denisse',
    love: 'Aunque hoy no podamos estar en el mismo lugar, quiero pasar la noche contigo. Prepara las palomitas: tenemos una cita.',
    signature: 'Con todo mi cariño, David',
  },

  // Música de fondo (colócala en public/music/). Deja en null para desactivarla.
  music: 'music/feel_it.mp3' as string | null,

  // "Confirmar asistencia" abre WhatsApp con un mensaje pre-escrito.
  rsvp: {
    whatsapp: '524741285394', // tu número con código de país, solo dígitos
    message: '¡Sí quiero nuestra cita de película! 🎬💕',
    buttonLabel: 'Confirmar asistencia',
    successLabel: '¡Nos vemos esa noche! 💕',
  },
} as const;

export type Invitation = typeof invitation;
