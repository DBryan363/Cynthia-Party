/* ==========================================================================
   The Birthday Tour — lógica de la invitación
   Los datos del evento viven en config.js. Este archivo no necesita cambios.
   ========================================================================== */
(() => {
  "use strict";

  const C = window.INVITE_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const STORE_KEY = "birthdayTour.demoList.v2"; // solo se usa en modo demo (sin Google Sheets)
  const loadedAt = Date.now();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Utilidades ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } },
    add(k) { try { localStorage.setItem(STORE_KEY, JSON.stringify([...this.get(), k])); } catch { /* modo privado */ } },
  };
  const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
  const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
  const pad = (n) => String(n).padStart(2, "0");
  // Misma clave que usa Code.gs para detectar nombres repetidos
  const nameKey = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, "").replace(/\s+/g, " ").trim();

  const tz = C.timeZone || undefined;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const ampm = (s) => s.replace(/\s?a\.?\s?m\.?/i, " AM").replace(/\s?p\.?\s?m\.?/i, " PM").replace(/ /g, " ");

  /* ---------- Noches del evento (config.events) ---------- */
  const rawEvents = Array.isArray(C.events) && C.events.length ? C.events
    : [{ id: "vie", startISO: C.startISO, venue: C.venue }]; // compatibilidad con la config antigua
  const events = rawEvents.map((e, i) => {
    const start = new Date(e.startISO);
    const ok = !isNaN(start);
    const f = (opts) => ok ? new Intl.DateTimeFormat("es", { timeZone: tz, ...opts }).format(start) : "—";
    const venue = e.venue || {};
    return {
      id: String(e.id || "n" + (i + 1)),
      label: e.label || `Noche ${i + 1}`,
      emoji: e.emoji || "🎉",
      start, ok, venue,
      weekday: cap(f({ weekday: "long" })),                                     // "Jueves"
      dayNum: f({ day: "numeric" }),                                            // "26"
      dateMid: f({ day: "numeric", month: "short" }).replace(/\./g, ""),       // "26 nov"
      short: cap(f({ weekday: "short", day: "numeric" }).replace(/\./g, "")),   // "Jue 26"
      timeLabel: e.timeTBD ? "Por confirmar" : ampm(f({ hour: "numeric", minute: "2-digit", hour12: true })),
      timeTBD: !!e.timeTBD,
      dress: e.dressCode || C.dressCode || {},
      hours: e.durationHours || C.durationHours || 5,
      mapsHref: venue.mapsUrl ||
        "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(venue.mapsQuery || venue.address || venue.name || ""),
    };
  });
  const multi = events.length > 1;
  const byId = (id) => events.find((e) => e.id === id);

  /* ---------- Render de datos generales ---------- */
  const name = clean(C.celebrant?.name, 30) || "Cumpleañer@";
  $("#celebrantName").textContent = name + "'s";
  document.title = `${name}'s Birthday`;
  const age = C.celebrant?.age;
  $("#vinylAge").textContent = age ? String(age) : "★";
  if (!multi) $("#ticketsKicker").textContent = "Tu pase";

  /* ---------- Calendario (enlace por noche) ---------- */
  const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/[.][0-9]{3}/, "");
  const calTitle = (e) => `${name}'s Birthday 🎉` + (multi ? ` · ${e.weekday}` : "");
  const calLoc = (e) => [e.venue.name, e.venue.address].filter(Boolean).join(", ");
  const calDetails = (e) => `Dress code: ${e.dress.title || ""}. ${e.dress.detail || ""}` +
    (e.timeTBD ? "\nHora por confirmar." : "") + `\n${location.href.split(/[?#]/)[0]}`;
  function googleCalUrl(e) {
    const end = new Date(e.start.getTime() + e.hours * 3600e3);
    const u = new URL("https://calendar.google.com/calendar/render");
    u.searchParams.set("action", "TEMPLATE");
    u.searchParams.set("text", calTitle(e));
    u.searchParams.set("dates", `${utc(e.start)}/${utc(end)}`);
    u.searchParams.set("location", calLoc(e));
    u.searchParams.set("details", calDetails(e));
    return u.toString();
  }
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
  function openIcs(e) {
    const end = new Date(e.start.getTime() + e.hours * 3600e3);
    const esc = (s) => s.replace(/[\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BirthdayTour//ES", "BEGIN:VEVENT",
      `UID:${utc(e.start)}-${e.id}-birthdaytour`, `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(e.start)}`, `DTEND:${utc(end)}`,
      `SUMMARY:${esc(calTitle(e))}`, `LOCATION:${esc(calLoc(e))}`, `DESCRIPTION:${esc(calDetails(e))}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  }

  /* ---------- Tickets ---------- */
  const tpl = $("#ticketTpl");
  const ticketsHost = $("#tickets");
  events.forEach((e, i) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const f = (k) => node.querySelector(`[data-f="${k}"]`);
    node.dataset.night = e.id;
    node.setAttribute("aria-label", `Pase ${e.label}: ${e.weekday} ${e.dateMid}`);
    f("label").textContent = e.label;
    f("weekday").textContent = e.weekday;
    f("date").textContent = e.dateMid;
    f("time").textContent = e.timeLabel;
    f("time").classList.toggle("is-tbd", e.timeTBD);
    f("venue").textContent = e.venue.name || "";
    f("address").textContent = e.venue.address || "";
    f("dress").textContent = e.dress.title || "";
    f("dressDetail").textContent = e.dress.detail || "";
    f("maps").href = e.mapsHref;
    f("maps").setAttribute("aria-label", `Cómo llegar a ${e.venue.name || "la fiesta"} (${e.weekday})`);
    const cal = f("cal");
    cal.setAttribute("aria-label", `Agendar el ${e.weekday.toLowerCase()} en tu calendario`);
    if (e.ok) {
      cal.href = googleCalUrl(e);
      cal.addEventListener("click", (ev) => { if (isApple && !window.__NO_ICS__) { ev.preventDefault(); openIcs(e); } });
    } else cal.hidden = true;
    f("seat").textContent = pad((hash(name + e.id) % 40) + 1);
    f("no").textContent = "Nº " + String(hash(navigator.userAgent + name + e.id) % 9000 + 1000);
    ticketsHost.appendChild(node);
  });

  // Saludo personalizado: comparte el link como …/?invitado=Ana
  const params = new URLSearchParams(location.search);
  const guestParam = clean(params.get("invitado") || params.get("para") || "", 30);
  if (guestParam) {
    const g = $("#greeting");
    g.textContent = `¡${titleCase(guestParam)}, tu nombre está en la lista VIP! ✨`;
    g.hidden = false;
    $("#firstName").value = titleCase(guestParam);
  }

  /* ---------- Ticker y sugerencias de canciones ---------- */
  const songs = Array.isArray(C.songs) ? C.songs : [];
  const ticker = $("#ticker");
  const frag = document.createDocumentFragment();
  const tickerItems = [`${name}'s Birthday`,
    ...events.map((e) => [e.short + " " + e.dateMid.split(" ")[1], e.venue.name, e.timeTBD ? "" : e.timeLabel].filter(Boolean).join(" · ")),
    age ? `${age} años` : "", "Pura magia",
    C.dressCode?.title ? `Dress code: ${C.dressCode.title}` : ""].filter(Boolean);
  for (let k = 0; k < 4; k++) tickerItems.forEach((s) => { const el = document.createElement("span"); el.textContent = s; frag.appendChild(el); });
  ticker.appendChild(frag);
  const dl = $("#songList");
  songs.forEach((s) => { const o = document.createElement("option"); o.value = s; dl.appendChild(o); });

  /* ---------- Estrellas de fondo ---------- */
  const stars = $("#stars");
  const count = window.innerWidth < 500 ? 14 : 24;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.textContent = Math.random() > .3 ? "★" : "✦";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.fontSize = 6 + Math.random() * 12 + "px";
    s.style.setProperty("--d", 3 + Math.random() * 5 + "s");
    s.style.setProperty("--delay", -Math.random() * 6 + "s");
    s.style.setProperty("--o", (.35 + Math.random() * .55).toFixed(2));
    stars.appendChild(s);
  }


  /* ---------- Cuenta regresiva (a la próxima noche) ---------- */
  const cdEls = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  const cdBox = $("#countdown");
  let cdTimer;
  function tickCountdown() {
    const now = Date.now();
    const next = events.find((e) => e.ok && now < e.start.getTime() + e.hours * 3600e3);
    if (!next) {
      clearInterval(cdTimer);
      cdBox.classList.add("is-live");
      $("#cdLive").textContent = events.some((e) => e.ok) ? "Gracias por bailar con nosotros ★" : "";
      $("#cdCap").textContent = "";
      return;
    }
    const diff = next.start - now;
    $("#cdCap").textContent = multi ? `para el ${next.weekday.toLowerCase()} ${next.dayNum}` : "";
    if (diff <= 0) {
      cdBox.classList.add("is-live");
      $("#cdLive").textContent = "¡La fiesta empezó! 🎉";
      return;
    }
    cdBox.classList.remove("is-live");
    const t = Math.floor(diff / 1000);
    const vals = { d: Math.floor(t / 86400), h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60 };
    for (const k in vals) {
      const v = pad(vals[k]);
      if (cdEls[k].textContent !== v) {
        cdEls[k].textContent = v;
        if (!reduceMotion) { cdEls[k].classList.remove("tick"); void cdEls[k].offsetWidth; cdEls[k].classList.add("tick"); }
      }
    }
  }
  tickCountdown();
  cdTimer = setInterval(tickCountdown, 1000);

  /* ---------- Formulario ---------- */
  const form = $("#rsvpForm");
  const msg = $("#formMsg");
  const btn = $("#submitBtn");
  const songField = $("#songField");

  // Opciones de asistencia: una por noche, "las dos" y "no podré"
  const attendField = $("#attendField");
  const choices = multi
    ? [...events.map((e) => ({ v: e.id, t: `${e.emoji} ${e.weekday} ${e.dayNum}`, sub: e.venue.name, cls: "yes" })),
       { v: "ambos", t: "✨ ¡A las dos!", sub: events.map((e) => e.short.split(" ")[0]).join(" + "), cls: "both" }]
    : [{ v: events[0].id, t: "🎉 ¡Ahí estaré!", cls: "yes" }];
  choices.push({ v: "no", t: "💔 No podré", sub: multi ? "Ninguna noche" : "", cls: "no" });
  if (!multi) $("#attendLegend").textContent = "¿Te apuntas a la fiesta?";
  choices.forEach((c, i) => {
    const label = document.createElement("label");
    label.className = `pill pill--${c.cls}`;
    const input = document.createElement("input");
    Object.assign(input, { type: "radio", name: "attending", value: c.v });
    if (i === 0) input.required = true;
    const span = document.createElement("span");
    span.textContent = c.t;
    if (c.sub) { const sm = document.createElement("small"); sm.textContent = c.sub; span.appendChild(sm); }
    label.append(input, span);
    attendField.appendChild(label);
  });
  const nightsFor = (v) => v === "ambos" ? events : events.filter((e) => e.id === v);

  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") {
      $("#attendField").classList.remove("is-invalid");
      songField.classList.toggle("is-hidden", e.target.value === "no");
    }
  });
  form.addEventListener("input", (e) => {
    e.target.closest(".line")?.classList.remove("is-invalid");
    if (msg.textContent) msg.textContent = "";
  });

  function readForm() {
    const fd = new FormData(form);
    return {
      firstName: titleCase(clean(fd.get("firstName"), 40)),
      lastName: titleCase(clean(fd.get("lastName"), 40)),
      attending: fd.get("attending") || "",
      song: fd.get("attending") && fd.get("attending") !== "no" ? clean(fd.get("song"), 80) : "",
      website: clean(fd.get("website"), 100), // honeypot
    };
  }

  function validate(d) {
    let first = null;
    const mark = (el, bad) => { el.classList.toggle("is-invalid", bad); if (bad && !first) first = el; };
    mark($("#firstName").closest(".line"), d.firstName.length < 2);
    mark($("#lastName").closest(".line"), d.lastName.length < 2);
    mark($("#attendField"), !d.attending);
    if (first) {
      msg.textContent = !d.attending && d.firstName.length >= 2 && d.lastName.length >= 2
        ? (multi ? "Elige a qué noche vienes 🎉" : "Elige si vienes o no 🎉")
        : "Escribe tu nombre y apellido para firmar la lista ✍️";
      (first.querySelector("input") || first).focus({ preventScroll: false });
      return false;
    }
    return true;
  }

  async function send(d) {
    const endpoint = (C.sheetsEndpoint || "").trim();
    if (!endpoint) {
      console.warn("[Birthday Tour] Modo demo: configura sheetsEndpoint en config.js para guardar respuestas.");
      await new Promise((r) => setTimeout(r, 900));
      const key = nameKey(d.firstName + " " + d.lastName);
      if (store.get().includes(key)) return { ok: false, error: "duplicate" };
      store.add(key);
      return { ok: true, demo: true };
    }
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    try {
      // text/plain evita el "preflight" CORS que Apps Script no soporta
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...d, elapsedMs: Date.now() - loadedAt }),
        redirect: "follow",
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      return data && typeof data.ok === "boolean" ? data : { ok: false, error: "bad_response" };
    } finally {
      clearTimeout(to);
    }
  }

  const ERRORS = {
    invalid: "Revisa tu nombre y apellido e inténtalo otra vez.",
    busy: "Hay mucha gente firmando a la vez 😅 Intenta de nuevo en unos segundos.",
    closed: "Las confirmaciones ya cerraron. Escríbele directamente a quien organiza.",
  };

  function resetForm() {
    form.reset();
    songField.classList.remove("is-hidden");
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    msg.textContent = "";
    msg.classList.remove("is-info");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    const d = readForm();
    if (!validate(d)) return;

    btn.disabled = true;
    btn.classList.add("is-loading");
    msg.textContent = "";
    msg.classList.remove("is-info");
    try {
      const r = await send(d);
      if (!r.ok) throw Object.assign(new Error(r.error || "error"), { code: r.error });
      resetForm(); // listo para anotar a otra persona
      showThanks({ firstName: d.firstName, lastName: d.lastName, attending: d.attending, song: d.song });
    } catch (err) {
      if (err.code === "duplicate") {
        msg.classList.add("is-info");
        msg.textContent = `✅ ${d.firstName} ${d.lastName} ya se registró en la lista.`;
        return;
      }
      msg.textContent = ERRORS[err.code] ||
        (err.name === "AbortError" ? "La conexión está lenta. Revisa tu señal e intenta de nuevo." :
         "No pudimos guardar tu respuesta. Revisa tu conexión e intenta de nuevo 🙏 (" + (err.code || err.name || "error") + ")");
    } finally {
      btn.disabled = false;
      btn.classList.remove("is-loading");
    }
  });

  /* ---------- Pase de agradecimiento ---------- */
  const overlay = $("#thanks");
  const slushColors = ["#ff5fa8", "#4f8dff", "#35d6c4", "#a66bff", "#e5243b"];
  if (age) $("#passSeal").textContent = String(age);
  let lastFocus = null;

  function showThanks(r) {
    const nights = nightsFor(r.attending);
    const yes = nights.length > 0;
    const both = multi && nights.length === events.length;
    const when = !multi ? "" : both ? " las dos noches" : ` el ${nights[0]?.weekday.toLowerCase()}`;
    const pass = overlay.querySelector(".pass");
    pass.classList.toggle("is-no", !yes);
    $("#passBand").textContent = yes ? "ALL ACCESS" : "WE'LL MISS YOU";
    $("#passEyebrow").textContent = yes ? (both ? "Backstage pass · 2 noches" : "Backstage pass") : "Gracias por avisar";
    $("#passName").textContent = `${r.firstName} ${r.lastName}`;
    $("#passMsg").textContent = yes
      ? `¡Estás en la lista, ${r.firstName}! Prepara tus mejores pasos (y tu varita ϟ): ${name} te espera${when} para bailar sin parar.`
      : `Te vamos a extrañar, ${r.firstName}. Bailaremos una por ti 💔 Gracias por avisar.`;

    const song = $("#passSong");
    song.hidden = !(yes && r.song);
    song.textContent = yes && r.song ? `🪩 Para la pista: “${r.song}” — ya se la pasamos al DJ` : "";

    const meta = $("#passMeta");
    meta.replaceChildren();
    if (yes) {
      const seat = (hash(r.firstName + r.lastName) % 98) + 1;
      const rows = nights.map((e) => [e.short, multi ? e.venue.name : e.timeLabel]);
      if (!multi) rows.unshift(["Fecha", nights[0].dateMid]);
      rows.push(["Asiento", "A-" + pad(seat)]);
      rows.forEach(([k, v]) => {
        const s = document.createElement("span"); const b = document.createElement("b");
        b.textContent = v; s.append(k, b); meta.appendChild(s);
      });
    }
    meta.hidden = !yes;

    overlay.querySelector(".slushie").style.setProperty("--c1", slushColors[Math.floor(Math.random() * slushColors.length)]);
    const sl = overlay.querySelector(".slushie"); sl.style.animation = "none"; void sl.offsetWidth; sl.style.animation = "";
    const ps = pass; ps.style.animation = "none"; void ps.offsetWidth; ps.style.animation = "";

    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("#dock").classList.add("is-hidden");
    if (yes && !reduceMotion) confetti();
    setTimeout(() => $("#closeBtn").focus({ preventScroll: true }), 50);
  }

  function hideThanks() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    updateDock();
    lastFocus?.focus?.({ preventScroll: true });
  }

  $("#closeBtn").addEventListener("click", hideThanks);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) hideThanks(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) hideThanks(); });
  $("#editBtn").addEventListener("click", () => {
    resetForm();
    hideThanks();
    $("#rsvp").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("#firstName").focus({ preventScroll: true }), 450);
  });

  /* Confeti de estrellas (ligero, sin librerías) */
  function confetti() {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:30;overflow:hidden";
    const colors = ["#ffc94a", "#e5243b", "#ffffff", "#f3d08a", "#ff5fa8"];
    const glyphs = ["★", "✦", "ϟ", "★", "♪"];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("span");
      p.textContent = glyphs[i % glyphs.length];
      const x = Math.random() * 100, dx = (Math.random() - .5) * 120, rot = (Math.random() - .5) * 720;
      p.style.cssText = `position:absolute;left:${x}%;top:-24px;font-size:${10 + Math.random() * 16}px;color:${colors[i % colors.length]}`;
      host.appendChild(p);
      p.animate(
        [{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${dx}px, 105vh) rotate(${rot}deg)`, opacity: .9 }],
        { duration: 1800 + Math.random() * 1600, delay: 250 + Math.random() * 500, easing: "cubic-bezier(.25,.6,.4,1)", fill: "forwards" }
      );
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 4500);
  }

  const dock = $("#dock");

  /* ---------- CTA fija: ocultar cuando el formulario está visible ---------- */
  let rsvpVisible = false;
  function updateDock() {
    dock.classList.toggle("is-hidden", rsvpVisible || !overlay.hidden);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => { rsvpVisible = en.isIntersecting; updateDock(); }, { threshold: 0.15 }).observe($("#rsvp"));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }
})();
