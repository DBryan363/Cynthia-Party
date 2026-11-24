/* ==========================================================================
   The Birthday Tour — lógica de la invitación
   Los datos del evento viven en config.js. Este archivo no necesita cambios.
   ========================================================================== */
(() => {
  "use strict";

  const C = window.INVITE_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const STORE_KEY = "birthdayTour.rsvp.v1";
  const loadedAt = Date.now();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Utilidades ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* modo privado */ } },
  };
  const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
  const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
  const pad = (n) => String(n).padStart(2, "0");

  const start = new Date(C.startISO);
  const validStart = !isNaN(start);
  const tz = C.timeZone || undefined;
  const fmt = (opts) => validStart ? new Intl.DateTimeFormat("es", { timeZone: tz, ...opts }).format(start) : "—";
  const dateLabel = fmt({ weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  const dateLong = fmt({ weekday: "long", day: "numeric", month: "long" });
  const timeLabel = fmt({ hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?a\.?\s?m\.?/i, " AM").replace(/\s?p\.?\s?m\.?/i, " PM").replace(/ /g, " ");

  /* ---------- Render de datos del evento ---------- */
  const name = clean(C.celebrant?.name, 30) || "Cumpleañer@";
  $("#celebrantName").textContent = name + "'s";
  document.title = `${name}'s Birthday`;
  const age = C.celebrant?.age;
  $("#vinylAge").textContent = age ? String(age) : "★";

  $("#evDate").textContent = dateLabel;
  $("#evTime").textContent = timeLabel;
  $("#evVenue").textContent = C.venue?.name || "";
  $("#evAddress").textContent = C.venue?.address || "";
  $("#evDress").textContent = C.dressCode?.title || "";
  $("#evDressDetail").textContent = C.dressCode?.detail || "";
  $("#deadline").textContent = C.rsvpDeadline || "la fiesta";

  const mapsHref = C.venue?.mapsUrl ||
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.venue?.mapsQuery || C.venue?.address || C.venue?.name || "");
  $("#mapsBtn").href = mapsHref;

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
  const tickerItems = [`${name}'s Birthday`, `${dateLabel} · ${timeLabel}`, C.venue?.name, C.venue?.address,
    age ? `${age} años` : "", "Una noche mágica", C.dressCode?.title ? `Dress code: ${C.dressCode.title}` : ""].filter(Boolean);
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

  /* ---------- Velas flotantes ---------- */
  const candles = $("#candles");
  const nC = window.innerWidth < 500 ? 7 : 12;
  for (let i = 0; i < nC; i++) {
    const c = document.createElement("span");
    c.className = "candle";
    c.style.left = (4 + (i * 92) / nC + Math.random() * 6) + "%";
    c.style.top = (3 + Math.random() * 42) + "%";
    c.style.setProperty("--h", 16 + Math.random() * 16 + "px");
    c.style.setProperty("--d", 4 + Math.random() * 4 + "s");
    c.style.setProperty("--delay", -Math.random() * 5 + "s");
    candles.appendChild(c);
  }

  /* ---------- Cuenta regresiva ---------- */
  const cdEls = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  let cdTimer;
  function tickCountdown() {
    if (!validStart) return;
    const diff = start - Date.now();
    if (diff <= 0) {
      clearInterval(cdTimer);
      const box = $("#countdown");
      box.classList.add("is-live");
      const after = Date.now() - start > (C.durationHours || 5) * 3600e3;
      box.innerHTML = `<div class="live">${after ? "Gracias por bailar con nosotros ★" : "¡La fiesta empezó! 🎉"}</div>`;
      return;
    }
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

  /* ---------- Agendar en calendario ---------- */
  $("#calBtn").addEventListener("click", () => {
    if (!validStart) return;
    const end = new Date(start.getTime() + (C.durationHours || 5) * 3600e3);
    const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = `${name}'s Birthday 🎉`;
    const loc = [C.venue?.name, C.venue?.address].filter(Boolean).join(", ");
    const details = `Dress code: ${C.dressCode?.title || ""}. ${C.dressCode?.detail || ""}\n${location.href.split("?")[0]}`;
    const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;

    if (isApple) {
      const esc = (s) => s.replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BirthdayTour//ES", "BEGIN:VEVENT",
        `UID:${utc(start)}-birthdaytour`, `DTSTAMP:${utc(new Date())}`,
        `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
        `SUMMARY:${esc(title)}`, `LOCATION:${esc(loc)}`, `DESCRIPTION:${esc(details)}`,
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    } else {
      const u = new URL("https://calendar.google.com/calendar/render");
      u.searchParams.set("action", "TEMPLATE");
      u.searchParams.set("text", title);
      u.searchParams.set("dates", `${utc(start)}/${utc(end)}`);
      u.searchParams.set("location", loc);
      u.searchParams.set("details", details);
      window.open(u.toString(), "_blank", "noopener");
    }
  });

  /* ---------- Formulario ---------- */
  const form = $("#rsvpForm");
  const msg = $("#formMsg");
  const btn = $("#submitBtn");
  const songField = $("#songField");

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
      song: fd.get("attending") === "si" ? clean(fd.get("song"), 80) : "",
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
        ? "Elige si vienes o no 🎉"
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    const d = readForm();
    if (!validate(d)) return;

    btn.disabled = true;
    btn.classList.add("is-loading");
    msg.textContent = "";
    try {
      const r = await send(d);
      if (!r.ok) throw Object.assign(new Error(r.error || "error"), { code: r.error });
      const saved = { firstName: d.firstName, lastName: d.lastName, attending: d.attending, song: d.song, at: Date.now() };
      store.set(saved);
      syncReturning(saved);
      showThanks(saved);
    } catch (err) {
      msg.textContent = ERRORS[err.code] ||
        (err.name === "AbortError" ? "La conexión está lenta. Revisa tu señal e intenta de nuevo." :
         "No pudimos guardar tu respuesta. Revisa tu conexión e intenta de nuevo 🙏");
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
    const yes = r.attending === "si";
    const pass = overlay.querySelector(".pass");
    pass.classList.toggle("is-no", !yes);
    $("#passBand").textContent = yes ? "ALL ACCESS" : "WE'LL MISS YOU";
    $("#passEyebrow").textContent = yes ? "Backstage pass" : "Gracias por avisar";
    $("#passName").textContent = `${r.firstName} ${r.lastName}`;
    $("#passMsg").textContent = yes
      ? `¡Estás en la lista, ${r.firstName}! Prepara tus mejores pasos (y tu varita ϟ): ${name} te espera para bailar toda la noche.`
      : `Te vamos a extrañar, ${r.firstName}. Bailaremos una por ti 💔 Si cambian tus planes, aquí mismo puedes actualizar tu respuesta.`;

    const song = $("#passSong");
    song.hidden = !(yes && r.song);
    song.textContent = yes && r.song ? `🪩 Para la pista: “${r.song}” — ya se la pasamos al DJ` : "";

    const meta = $("#passMeta");
    meta.replaceChildren();
    if (yes) {
      const seat = (hash(r.firstName + r.lastName) % 98) + 1;
      [["Fecha", dateLabel], ["Hora", timeLabel], ["Asiento", "A-" + pad(seat)]].forEach(([k, v]) => {
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
    const r = store.get();
    if (r) prefill(r);
    hideThanks();
    $("#rsvp").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("#firstName").focus({ preventScroll: true }), 450);
  });

  function prefill(r) {
    $("#firstName").value = r.firstName || "";
    $("#lastName").value = r.lastName || "";
    const radio = form.querySelector(`input[name="attending"][value="${r.attending === "no" ? "no" : "si"}"]`);
    if (radio) radio.checked = true;
    $("#song").value = r.song || "";
    songField.classList.toggle("is-hidden", r.attending === "no");
  }

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

  /* ---------- Invitado que vuelve ---------- */
  const dock = $("#dock");
  function syncReturning(r) {
    if (!r) return;
    dock.querySelector("span").textContent = "Ver mi pase";
    $("#submitBtn .btn__txt").textContent = "Actualizar respuesta ★";
  }
  const previous = store.get();
  if (previous) {
    syncReturning(previous);
    if (!guestParam) prefill(previous);
  }
  dock.addEventListener("click", (e) => {
    const r = store.get();
    if (r) { e.preventDefault(); showThanks(r); }
  });

  // Número de ticket estable por dispositivo
  $("#stubNo").textContent = "Nº " + String(hash(navigator.userAgent + name) % 9000 + 1000);
  $("#stubSeat").textContent = pad((hash(name) % 40) + 1);

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
