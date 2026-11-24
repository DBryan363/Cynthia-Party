/* =========================================================================
   ✏️  CONFIGURACIÓN DEL EVENTO — edita SOLO este archivo
   Todo el texto de la invitación sale de aquí. No necesitas tocar nada más.
   ========================================================================= */
window.INVITE_CONFIG = {
  // Quién cumple
  celebrant: {
    name: "Cynthia",            // Nombre que aparece en grande
    age: 29,                    // Pon null si no quieres mostrar la edad
  },

  // Fecha y hora (formato ISO con la zona horaria de la fiesta)
  // Ej: "2026-11-27T23:00:00-05:00" = 27 de noviembre de 2026, 11:00 PM (UTC-5)
  startISO: "2026-11-27T23:00:00-05:00",
  durationHours: 5,             // Para el botón "Agendar" (calendario)
  timeZone: "America/Lima",   // Zona horaria para mostrar fecha/hora

  // Lugar
  venue: {
    name: "José Pereira 560",
    address: "Los Olivos, Lima",
    // Lo que se buscará en Google Maps (puede ser la dirección o el nombre del lugar).
    // Si tienes un enlace exacto de Google Maps, ponlo en mapsUrl y tendrá prioridad.
    mapsQuery: "José Pereira 560, Los Olivos, Lima, Perú",
    mapsUrl: "https://maps.app.goo.gl/xM7bisZmAAsEdKe6A",
  },

  // Dress code
  dressCode: {
    title: "Rojo, negro y dorado",
    detail: "Cuadros opcional ✨",
  },

  // Fecha límite para confirmar (texto libre, se muestra tal cual)
  rsvpDeadline: "25 de noviembre",

  // URL de la Web App de Google Apps Script (ver README → "Conectar Google Sheets").
  // Déjala vacía para probar en "modo demo" (no guarda nada, solo simula).
  sheetsEndpoint: "",

  // Sugerencias para el campo "¿Qué canción quieres bailar?"
  songs: [
    "Don't Stop Believin'",
    "What Makes You Beautiful",
    "Story of My Life",
    "Teenage Dream",
    "Live While We're Young",
    "Defying Gravity",
    "Best Song Ever",
    "Somebody to Love",
    "Kiss You",
    "Valerie",
    "Night Changes",
    "Loser Like Me",
    "One Thing",
    "Rehab",
    "Little Things",
    "Toxic",
    "Cómo te atreves",
    "Besos en guerra",
    "Mi nuevo vicio",
    "Yo contigo, tú conmigo",
    "Bajo la mesa",
    "Cuando nadie ve",
  ],
};
