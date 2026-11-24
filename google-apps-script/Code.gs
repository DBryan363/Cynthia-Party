/**
 * The Birthday Tour — receptor de confirmaciones (Google Apps Script)
 * ------------------------------------------------------------------
 * Pega este archivo en Extensiones → Apps Script de tu Google Sheet.
 * Instrucciones completas en el README del proyecto.
 *
 * Seguridad:
 *  - La hoja sigue siendo PRIVADA: la página solo puede ESCRIBIR una respuesta,
 *    nunca leer la lista de invitados (doGet no devuelve datos).
 *  - Validación y límites de longitud en el servidor.
 *  - Neutraliza "inyección de fórmulas" (=, +, -, @) en las celdas.
 *  - Campo trampa (honeypot), tiempo mínimo de llenado y límite de envíos por minuto.
 *  - Si un invitado vuelve a responder con el mismo nombre y apellido,
 *    se ACTUALIZA su fila en vez de duplicarla.
 */

const CONFIG = {
  SHEET_NAME: 'Respuestas',
  SUMMARY_NAME: 'Resumen',
  MAX_PER_MINUTE: 40,     // envíos totales por minuto antes de pedir que reintenten
  MIN_FILL_MS: 2500,      // menos que esto = probablemente un bot
  CLOSED: false,          // cámbialo a true para cerrar las confirmaciones
};

const HEADERS = ['Nombre', 'Apellido', 'Asistirá', 'Canción', 'Primera respuesta', 'Última actualización', 'Cambios', 'Clave'];

function doPost(e) {
  try {
    if (CONFIG.CLOSED) return json_({ ok: false, error: 'closed' });

    const body = parseBody_(e);
    if (!body) return json_({ ok: false, error: 'invalid' });

    // Honeypot o envío demasiado rápido → fingimos éxito y no guardamos nada.
    if (body.website || Number(body.elapsedMs) < CONFIG.MIN_FILL_MS) return json_({ ok: true });

    const firstName = cleanText_(body.firstName, 40);
    const lastName = cleanText_(body.lastName, 40);
    const attending = body.attending === 'si' ? 'Sí' : body.attending === 'no' ? 'No' : '';
    const song = attending === 'Sí' ? cleanText_(body.song, 80) : '';

    if (firstName.length < 2 || lastName.length < 2 || !attending) return json_({ ok: false, error: 'invalid' });
    if (!rateLimitOk_()) return json_({ ok: false, error: 'busy' });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });
    try {
      const sheet = getSheet_();
      const key = normalizeKey_(firstName + ' ' + lastName);
      const now = new Date();
      const row = findRowByKey_(sheet, key);

      if (row) {
        const prevChanges = Number(sheet.getRange(row, 7).getValue()) || 0;
        sheet.getRange(row, 1, 1, 4).setValues([[safe_(firstName), safe_(lastName), attending, safe_(song)]]);
        sheet.getRange(row, 6, 1, 2).setValues([[now, prevChanges + 1]]);
      } else {
        sheet.appendRow([safe_(firstName), safe_(lastName), attending, safe_(song), now, now, 0, key]);
      }
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

/** Comprobación de salud. No expone ningún dato de invitados. */
function doGet() {
  return json_({ ok: true, service: 'birthday-tour-rsvp' });
}

/**
 * Ejecuta esta función UNA VEZ desde el editor (botón ▶ Ejecutar)
 * para crear las pestañas "Respuestas" y "Resumen" con formato.
 */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sheet = getSheet_();

  let sum = ss.getSheetByName(CONFIG.SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(CONFIG.SUMMARY_NAME);
  sum.clear();
  const R = "'" + CONFIG.SHEET_NAME + "'";
  sum.getRange('A1:B1').setValues([['🎤 The Birthday Tour', '']]).setFontWeight('bold').setFontSize(14);
  sum.getRange('A3:B6').setValues([
    ['✅ Confirmados', '=COUNTIF(' + R + '!C2:C,"Sí")'],
    ['💔 No asistirán', '=COUNTIF(' + R + '!C2:C,"No")'],
    ['📝 Total respuestas', '=COUNTA(' + R + '!A2:A)'],
    ['🎶 Canciones pedidas', '=COUNTA(' + R + '!D2:D)'],
  ]);
  sum.getRange('A8').setValue('Lista de confirmados').setFontWeight('bold');
  sum.getRange('A9').setFormula('=IFERROR(SORT(FILTER({' + R + '!A2:A&" "&' + R + '!B2:B,' + R + '!D2:D},' + R + '!C2:C="Sí"),1,TRUE),"Aún nadie")');
  sum.setColumnWidth(1, 260);
  sum.setColumnWidth(2, 260);
  ss.setActiveSheet(sum);
}

/* ------------------------------ helpers ------------------------------ */

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#1b1530').setFontColor('#ffc94a');
    sheet.setFrozenRows(1);
    sheet.getRange('E:F').setNumberFormat('dd/mm/yyyy hh:mm');
    sheet.hideColumns(8); // la clave es interna
    sheet.setColumnWidths(1, 4, 170);
  }
  return sheet;
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  if (e.postData.contents.length > 2000) return null;
  try {
    const o = JSON.parse(e.postData.contents);
    return o && typeof o === 'object' ? o : null;
  } catch (_) {
    return null;
  }
}

function cleanText_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Evita que un texto como "=IMPORTXML(...)" se ejecute como fórmula. */
function safe_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function normalizeKey_(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim();
}

function findRowByKey_(sheet, key) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const keys = sheet.getRange(2, 8, last - 1, 1).getValues();
  for (let i = 0; i < keys.length; i++) if (keys[i][0] === key) return i + 2;
  return 0;
}

function rateLimitOk_() {
  const cache = CacheService.getScriptCache();
  const bucket = 'rl_' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(bucket) || 0) + 1;
  cache.put(bucket, String(n), 120);
  return n <= CONFIG.MAX_PER_MINUTE;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
