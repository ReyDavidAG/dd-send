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
    movie: 'Nombre de la película',
    // Fecha/hora en ISO con zona horaria. Ejemplo (hora del centro de México):
    datetime: '2026-07-25T21:00:00-06:00',
    datetimeLabel: 'Viernes 25 de julio · 9:00 PM',
    callLink: 'https://meet.google.com/tu-enlace',
    callLabel: 'Entrar a la videollamada',
  },

  // Fotos (colócalas en public/images/). Rutas relativas, sin dominio.
  photos: ['images/foto-1.jpg', 'images/foto-2.jpg', 'images/foto-3.jpg'],

  // Textos personalizados
  messages: {
    tapToOpen: 'Toca para abrir',
    greeting: 'Para ti, Denisse',
    love: 'Aunque hoy no podamos estar en el mismo lugar, quiero pasar la noche contigo. Prepara las palomitas: tenemos una cita.',
    signature: 'Con todo mi cariño, David',
  },

  // Música de fondo (colócala en public/music/). Deja en null para desactivarla.
  music: 'music/cancion.mp3' as string | null,

  // "Confirmar asistencia" abre WhatsApp con un mensaje pre-escrito.
  rsvp: {
    whatsapp: '5211234567890', // tu número con código de país, solo dígitos
    message: '¡Sí quiero nuestra cita de película! 🎬💕',
    buttonLabel: 'Confirmar asistencia',
    successLabel: '¡Nos vemos esa noche! 💕',
  },
} as const;

export type Invitation = typeof invitation;
