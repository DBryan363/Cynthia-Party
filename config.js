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

  // Las noches de la fiesta. Cada una tiene su propio ticket.
  // - id: código corto que se guarda en Google Sheets (si lo cambias, cámbialo también en Code.gs → NIGHTS).
  // - startISO: fecha y hora con la zona horaria de la fiesta. Ej: "2026-11-27T23:00:00-05:00" = 27 nov 2026, 11:00 PM.
  // - timeTBD: true muestra "Por confirmar" en vez de la hora.
  // - dressCode (opcional): si una noche tiene otro dress code, ponlo dentro de esa noche.
  events: [
    {
      id: "jue",
      label: "Noche 1",
      emoji: "🌙",
      startISO: "2026-11-26T22:00:00-05:00", // ⚠️ hora provisional, falta confirmarla
      timeTBD: true,
      venue: {
        name: "Versus",
        address: "Lince, Lima",
        mapsQuery: "Versus, Lince, Lima, Perú",
        mapsUrl: "",                 // pega aquí el link exacto de Google Maps cuando lo tengas
      },
    },
    {
      id: "vie",
      label: "Noche 2",
      emoji: "🎉",
      startISO: "2026-11-27T23:00:00-05:00",
      venue: {
        name: "José Pereira 560",
        address: "Los Olivos, Lima",
        mapsQuery: "José Pereira 560, Los Olivos, Lima, Perú",
        mapsUrl: "https://maps.app.goo.gl/xM7bisZmAAsEdKe6A",
      },
    },
  ],
  durationHours: 5,             // Para el botón "Agendar" (calendario)
  timeZone: "America/Lima",     // Zona horaria para mostrar fecha/hora

  // Dress code (para todas las noches, salvo que una noche tenga el suyo)
  dressCode: {
    title: "Rojo, negro y dorado",
    detail: "Cuadros opcional ✨",
  },

  // URL de la Web App de Google Apps Script (ver README → "Conectar Google Sheets").
  // Déjala vacía para probar en "modo demo" (no guarda nada, solo simula).
  sheetsEndpoint: "https://script.google.com/macros/s/AKfycbzX1BlC2XqdV-_fRv4Io7eelAGpPRtuwzxSwXjhmLyFYV2Tq65nwA2640S3hcKkIxrF/exec",
};
