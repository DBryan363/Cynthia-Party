/* =========================================================================
   ✏️  CONFIGURACIÓN DEL EVENTO — edita SOLO este archivo
   Todo el texto de la invitación sale de aquí. No necesitas tocar nada más.
   ========================================================================= */
window.INVITE_CONFIG = {
  // Quién cumple
  celebrant: {
    name: "Valentina",          // Nombre que aparece en grande
    age: 30,                    // Pon null si no quieres mostrar la edad
  },

  // Fecha y hora (formato ISO con la zona horaria de la fiesta)
  // Ej: "2026-12-12T20:00:00-05:00" = 12 de diciembre de 2026, 8:00 PM (UTC-5)
  startISO: "2026-12-12T20:00:00-05:00",
  durationHours: 5,             // Para el botón "Agendar" (calendario)
  timeZone: "America/Bogota",   // Zona horaria para mostrar fecha/hora

  // Lugar
  venue: {
    name: "Salón Neón Club",
    address: "Calle 85 #11-53, Bogotá",
    // Lo que se buscará en Google Maps (puede ser la dirección o el nombre del lugar).
    // Si tienes un enlace exacto de Google Maps, ponlo en mapsUrl y tendrá prioridad.
    mapsQuery: "Calle 85 #11-53, Bogotá",
    mapsUrl: "",
  },

  // Dress code
  dressCode: {
    title: "Pop Star 2012",
    detail: "Rojo, negro o dorado. Chaquetas varsity, camisas a cuadros, bandanas y mucho brillo ✨",
  },

  // Fecha límite para confirmar (texto libre, se muestra tal cual)
  rsvpDeadline: "5 de diciembre",

  // URL de la Web App de Google Apps Script (ver README → "Conectar Google Sheets").
  // Déjala vacía para probar en "modo demo" (no guarda nada, solo simula).
  sheetsEndpoint: "",

  // Canciones para la cinta que se desliza arriba y sugerencias del formulario
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
  ],
};
