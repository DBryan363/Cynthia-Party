/**
 * Cynthia's Birthday — receptor de confirmaciones (Google Apps Script)
 * ------------------------------------------------------------------
 * Pega este archivo en Extensiones → Apps Script de tu Google Sheet.
 * Instrucciones completas en el README del proyecto.
 *
 * Qué guarda (pestaña "Respuestas"):
 *   Nombre · Apellido · Asistirá (Jueves / Viernes / Ambas / No) · Comentario · Fecha de registro
 *
 * Seguridad:
 *  - La hoja sigue siendo PRIVADA: la página solo puede ESCRIBIR una respuesta,
 *    nunca leer la lista de invitados (doGet no devuelve datos).
 *  - Validación y límites de longitud en el servidor.
 *  - Neutraliza "inyección de fórmulas" (=, +, -, @) en las celdas.
 *  - Campo trampa (honeypot), tiempo mínimo de llenado y límite de envíos por minuto.
 *  - Las respuestas son FIJAS: si alguien intenta registrar un nombre y apellido
 *    que ya está en la lista, no se cambia nada y la página avisa "ya se registró".
 */

const CONFIG = {
  SPREADSHEET_ID: '19KnMcRsxcUHC2EP9jRaOUc6xBEyzpbyvVsTqLvEd1G8', // hoja de invitados de Cynthia
  SHEET_NAME: 'Respuestas',
  SUMMARY_NAME: 'Resumen',
  MAX_PER_MINUTE: 40,     // envíos totales por minuto antes de pedir que reintenten
  MIN_FILL_MS: 2500,      // menos que esto = probablemente un bot
  CLOSED: false,          // cámbialo a true para cerrar las confirmaciones
};

// Opciones que envía la invitación → lo que se escribe en la columna "Asistirá".
// Los códigos (jue, vie) deben coincidir con los "id" de config.js → events.
const NIGHTS = { jue: 'Jueves', vie: 'Viernes', ambos: 'Ambas', no: 'No' };

// La columna "Clave" (nombre normalizado) va oculta y sirve para detectar repetidos.
const HEADERS = ['Nombre', 'Apellido', 'Asistirá', 'Comentario', 'Fecha de registro', 'Clave'];
const KEY_COL = HEADERS.indexOf('Clave') + 1;

function doPost(e) {
  try {
    if (CONFIG.CLOSED) return json_({ ok: false, error: 'closed' });

    const body = parseBody_(e);
    if (!body) return json_({ ok: false, error: 'invalid' });

    // Honeypot o envío demasiado rápido → fingimos éxito y no guardamos nada.
    if (body.website || Number(body.elapsedMs) < CONFIG.MIN_FILL_MS) return json_({ ok: true });

    const firstName = cleanText_(body.firstName, 40);
    const lastName = cleanText_(body.lastName, 40);
    const attending = Object.prototype.hasOwnProperty.call(NIGHTS, body.attending) ? NIGHTS[body.attending] : '';
    const comment = cleanText_(body.comment, 300);

    if (firstName.length < 2 || lastName.length < 2 || !attending) return json_({ ok: false, error: 'invalid' });
    if (!rateLimitOk_()) return json_({ ok: false, error: 'busy' });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });
    try {
      const sheet = getSheet_();
      const key = normalizeKey_(firstName + ' ' + lastName);
      if (findRowByKey_(sheet, key)) return json_({ ok: false, error: 'duplicate' }); // ya registrado: no se modifica
      sheet.appendRow([safe_(firstName), safe_(lastName), attending, safe_(comment), new Date(), key]);
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
  return json_({ ok: true, service: 'birthday-rsvp' });
}

/**
 * Ejecuta esta función UNA VEZ desde el editor (botón ▶ Ejecutar)
 * para crear las pestañas "Respuestas" y "Resumen" con formato.
 */
function setup() {
  const ss = ss_();
  getSheet_();

  let sum = ss.getSheetByName(CONFIG.SUMMARY_NAME);
  if (!sum) sum = ss.insertSheet(CONFIG.SUMMARY_NAME);
  sum.clear();
  const R = "'" + CONFIG.SHEET_NAME + "'";
  const C_ = R + '!C2:C';
  sum.getRange('A1:B1').setValues([["🎉 Cynthia's Birthday", '']]).setFontWeight('bold').setFontSize(14);
  sum.getRange('A3:B8').setValues([
    ['🌙 Van el jueves', '=COUNTIF(' + C_ + ',"Jueves")+COUNTIF(' + C_ + ',"Ambas")'],
    ['🎉 Van el viernes', '=COUNTIF(' + C_ + ',"Viernes")+COUNTIF(' + C_ + ',"Ambas")'],
    ['✨ Van a las dos', '=COUNTIF(' + C_ + ',"Ambas")'],
    ['💔 No asistirán', '=COUNTIF(' + C_ + ',"No")'],
    ['📝 Total respuestas', '=COUNTA(' + R + '!A2:A)'],
    ['💌 Comentarios', '=COUNTA(' + R + '!D2:D)'],
  ]);
  sum.getRange('A10:C10').setValues([['Lista de confirmados', 'Noche', 'Comentario']]).setFontWeight('bold');
  sum.getRange('A11').setFormula('=IFERROR(SORT(FILTER({' + R + '!A2:A&" "&' + R + '!B2:B,' + C_ + ',' + R + '!D2:D},' + C_ + '<>"No",' + C_ + '<>""),1,TRUE),"Aún nadie")');
  sum.setColumnWidth(1, 260);
  sum.setColumnWidth(2, 120);
  sum.setColumnWidth(3, 360);
  ss.setActiveSheet(sum);
}

/* ------------------------------ helpers ------------------------------ */

function ss_() {
  return CONFIG.SPREADSHEET_ID ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID) : SpreadsheetApp.getActive();
}

function getSheet_() {
  const ss = ss_();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#1b1530').setFontColor('#ffc94a');
    sheet.setFrozenRows(1);
    sheet.getRange('E:E').setNumberFormat('dd/mm/yyyy hh:mm');
    sheet.hideColumns(KEY_COL); // la clave es interna
    sheet.setColumnWidths(1, 3, 150);
    sheet.setColumnWidth(4, 320);
    sheet.setColumnWidth(5, 140);
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
  const keys = sheet.getRange(2, KEY_COL, last - 1, 1).getValues();
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
