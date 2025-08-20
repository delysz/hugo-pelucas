(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const formatEUR = (n) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  const encode = (s) => encodeURIComponent(String(s ?? ""));

  // Carrusel
  (function carousel() {
    const root = $(".carousel");
    if (!root) return;

    const items = $$(".carousel-item", root);
    const prevBtn = $(".carousel-btn.prev", root);
    const nextBtn = $(".carousel-btn.next", root);
    if (!items.length) return;

    let idx = Math.max(0, items.findIndex((i) => i.classList.contains("active")));
    if (idx < 0) idx = 0;

    let timer = null;
    const DURATION = 9000;

    function show(i) {
      items.forEach((el, k) => el.classList.toggle("active", k === i));
      idx = i;
    }
    function next() { show((idx + 1) % items.length); }
    function prev() { show((idx - 1 + items.length) % items.length); }
    function play() { stop(); timer = setInterval(next, DURATION); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    on(prevBtn, "click", () => { prev(); play(); });
    on(nextBtn, "click", () => { next(); play(); });

    on(root, "mouseenter", stop);
    on(root, "mouseleave", play);

    on(root, "keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); play(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); play(); }
    });
    root.setAttribute("tabindex", "0");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Carrusel de opiniones de clientes");

    let startX = 0, dx = 0, touching = false;
    on(root, "touchstart", (e) => {
      touching = true;
      startX = e.touches[0].clientX;
      dx = 0;
      stop();
    }, { passive: true });
    on(root, "touchmove", (e) => {
      if (!touching) return;
      dx = e.touches[0].clientX - startX;
    }, { passive: true });
    on(root, "touchend", () => {
      touching = false;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      play();
    });

    show(idx);
    play();
  })();

  // Scroll suave + nav activo
  (function smoothScrollAndActiveNav() {
    const links = $$("nav a[href^='#']");
    if (!links.length) return;

    links.forEach((a) => on(a, "click", (e) => {
      const id = a.getAttribute("href");
      const target = id ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    }));

    const sections = links
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
      .map((id) => ({ id, el: $(id) }))
      .filter((x) => x.el);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = "#" + en.target.id;
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });

    sections.forEach(({ el }) => io.observe(el));
  })();

  // Servicios dinámicos + total y reserva por WhatsApp
  (function services() {
    const host = $("#servicios");
    if (!host) return;
    if (host.querySelector(".svc-wrap")) return;

    const CATALOG = [
      { id: "corte", name: "Corte clásico", price: 12 },
      { id: "fade", name: "Corte fade", price: 14 },
      { id: "barba", name: "Arreglo de barba", price: 10 },
      { id: "afeitado", name: "Afeitado a navaja", price: 11 },
      { id: "combo", name: "Corte + Barba", price: 20 },
      { id: "nino", name: "Corte niño", price: 9 },
    ];

    const waCTA = $(".whatsapp-btn.grande");
    const waHref = waCTA?.getAttribute("href") || "";
    const waNumber = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "34123456789";

    const wrap = document.createElement("div");
    wrap.className = "svc-wrap";
    wrap.innerHTML = `
      <div class="svc-grid"></div>
      <div class="svc-bar">
        <div class="svc-when">
          <label>Fecha y hora preferida</label>
          <input type="datetime-local" class="svc-dt">
        </div>
        <div class="svc-total"><span>Total:</span> <strong class="svc-amount">0 €</strong></div>
        <button type="button" class="svc-wa">Reservar por WhatsApp</button>
      </div>
    `;
    host.appendChild(wrap);

    const style = document.createElement("style");
    style.textContent = `
      .svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px; }
      .svc-card { border: 2px solid #f6c90e; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 2px 12px rgba(26,34,56,0.06); background: #fff; }
      .svc-card h3 { margin: 0; font-size: 1.05rem; color: #232946; }
      .svc-card .price { font-weight: 700; color: #232946; }
      .svc-card button { align-self: flex-start; background: #232946; color:#fff; border: 2px solid #f6c90e; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: 700; }
      .svc-card button.active { background: #f6c90e; color:#232946; }
      .svc-bar { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; border-top: 3px solid #f6c90e; padding-top: 14px; }
      .svc-when label { display:block; font-weight:700; margin-bottom:6px; color:#232946;}
      .svc-dt { padding: 10px; border-radius: 6px; border:1.5px solid #232946; background:#f5f6fa; }
      .svc-total { font-size:1.1rem; }
      .svc-wa { background: linear-gradient(90deg, #f6c90e 0%, #232946 100%); color:#232946; border: 2px solid #f6c90e; border-radius: 10px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
      @media (max-width:720px){ .svc-bar { grid-template-columns: 1fr; } .svc-total { justify-self: start; } }
    `;
    document.head.appendChild(style);

    const grid = $(".svc-grid", wrap);
    const amountEl = $(".svc-amount", wrap);
    const dtInput = $(".svc-dt", wrap);
    const waBtn = $(".svc-wa", wrap);

    const selected = new Set();

    function renderCards() {
      grid.innerHTML = "";
      CATALOG.forEach((svc) => {
        const card = document.createElement("article");
        card.className = "svc-card";
        card.innerHTML = `
          <h3>${svc.name}</h3>
          <div class="price">${formatEUR(svc.price)}</div>
          <button type="button" data-id="${svc.id}" aria-pressed="false">Añadir</button>
        `;
        const btn = $("button", card);
        on(btn, "click", () => {
          const isActive = btn.classList.toggle("active");
          btn.textContent = isActive ? "Quitar" : "Añadir";
          btn.setAttribute("aria-pressed", String(isActive));
          if (isActive) selected.add(svc.id);
          else selected.delete(svc.id);
          updateTotal();
        });
        grid.appendChild(card);
      });
    }

    function updateTotal() {
      const total = CATALOG.filter((s) => selected.has(s.id)).reduce((a, b) => a + b.price, 0);
      amountEl.textContent = formatEUR(total);
    }

    on(waBtn, "click", () => {
      const chosen = CATALOG.filter((s) => selected.has(s.id));
      if (!chosen.length) { alert("Selecciona al menos un servicio."); return; }
      const dtVal = dtInput.value ? new Date(dtInput.value) : null;
      const whenTxt = dtVal
        ? `${dtVal.toLocaleDateString("es-ES")} ${dtVal.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
        : "Sin fecha/hora";

      const lines = [
        "Hola, me gustaría reservar:",
        ...chosen.map((s) => `• ${s.name} — ${formatEUR(s.price)}`),
        `Total aprox.: ${formatEUR(chosen.reduce((a, b) => a + b.price, 0))}`,
        `Fecha/hora preferida: ${whenTxt}`,
        "",
        "¿Hay disponibilidad? ¡Gracias!"
      ];
      const url = `https://wa.me/${waNumber}?text=${encode(lines.join("\n"))}`;
      window.open(url, "_blank", "noopener");
    });

    renderCards();
    updateTotal();
  })();

  // ===== Lightbox para galería =====
  (function galleryLightbox() {
    function init() {
      const grid = document.querySelector(".gallery-grid");
      if (!grid) return;

      // crear contenedor si no existe
      let lb = document.querySelector(".lightbox");
      if (!lb) {
        lb = document.createElement("div");
        lb.className = "lightbox";
        lb.setAttribute("hidden", "");
        lb.innerHTML = `
          <button class="lb-close" aria-label="Cerrar">&times;</button>
          <img class="lb-img" alt="">
          <button class="lb-prev" aria-label="Anterior">&#10094;</button>
          <button class="lb-next" aria-label="Siguiente">&#10095;</button>
        `;
        document.body.appendChild(lb);
      }

      const imgEl = lb.querySelector(".lb-img");
      const btnClose = lb.querySelector(".lb-close");
      const btnPrev = lb.querySelector(".lb-prev");
      const btnNext = lb.querySelector(".lb-next");

      const items = Array.from(grid.querySelectorAll(".gallery-item"));
      let idx = -1;

      function open(i) {
        idx = i;
        const a = items[idx];
        const full = a.getAttribute("data-full") || a.getAttribute("href");
        const alt = a.querySelector("img")?.getAttribute("alt") || "";
        imgEl.src = full;
        imgEl.alt = alt;
        lb.hidden = false;
        document.body.style.overflow = "hidden";
      }
      function close() {
        lb.hidden = true;
        imgEl.src = "";
        document.body.style.overflow = "";
      }
      const prev = () => open((idx - 1 + items.length) % items.length);
      const next = () => open((idx + 1) % items.length);

      grid.addEventListener("click", (e) => {
        const a = e.target.closest(".gallery-item");
        if (!a) return;
        e.preventDefault();
        const i = items.indexOf(a);
        if (i >= 0) open(i);
      });
      btnClose.addEventListener("click", close);
      btnPrev.addEventListener("click", prev);
      btnNext.addEventListener("click", next);
      lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

      window.addEventListener("keydown", (e) => {
        if (lb.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

  // Aviso 'síguenos' cuando el usuario llega al final (con retardo robusto)
  (function followCTA() {
    function init() {
      const footer = document.querySelector("footer");
      if (!footer) return;

      // 1) Asegurar que el CTA existe ANTES de usarlo
      let cta = document.getElementById("follow-cta");
      if (!cta) {
        cta = document.createElement("div");
        cta.className = "follow-cta";
        cta.id = "follow-cta";
        cta.hidden = true;
        cta.innerHTML = `
        <button class="cta-close" aria-label="Cerrar">&times;</button>
        <p>¡No te olvides de seguirnos en nuestras RRSS!</p>
        <div class="cta-actions">
          <a href="https://www.instagram.com/barberia_hugo_" target="_blank" rel="noopener" class="btn-cta ig">
            <img src="icons8-instagram.svg" alt="" aria-hidden="true"> Instagram
          </a>
          <a href="https://www.facebook.com/p/Hugo-Barberia-Campos-100058625056973/" target="_blank" rel="noopener" class="btn-cta fb">
            <img src="icons8-facebook-nuevo.svg" alt="" aria-hidden="true"> Facebook
          </a>
        </div>
      `;
        document.body.appendChild(cta);
      }

      // 2) Cerrar y recordar el descarte
      const closeBtn = cta.querySelector(".cta-close");
      const hideCTA = () => {
        cta.classList.remove("show");
        sessionStorage.setItem("ctaDismissed", "1");
        clearTimeout(timer);
        setTimeout(() => { cta.hidden = true; }, 200);
      };
      closeBtn?.addEventListener("click", hideCTA);

      // 3) Retardo de aparición
      const DELAY = 3000; // 3s
      let timer = null;

      const showCTA = () => {
        if (sessionStorage.getItem("ctaDismissed") || cta.classList.contains("show")) return;
        cta.hidden = false;
        requestAnimationFrame(() => cta.classList.add("show"));
      };
      const scheduleShow = () => {
        clearTimeout(timer);
        timer = setTimeout(showCTA, DELAY);
      };
      const cancelShow = () => {
        clearTimeout(timer);
        timer = null;
      };

      // 4) Observar el footer (con retardo y cancelación si se va)
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => en.isIntersecting ? scheduleShow() : cancelShow());
      }, { threshold: 0.1 });
      io.observe(footer);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

  // Miscelánea
  (function misc() {
    $$("a[target='_blank']").forEach((a) => {
      if (!/noopener/.test(a.rel)) a.rel = (a.rel ? a.rel + " " : "") + "noopener";
    });

    const map = $(".mapa iframe");
    if (map) {
      on(map, "error", () => {
        const backup = document.createElement("p");
        backup.innerHTML = `<a href="https://www.google.com/maps?q=41.7171479,-0.8414919" target="_blank">Abrir mapa en Google Maps</a>`;
        map.replaceWith(backup);
      });
    }
  })();

})();

// ===== GALERÍA: autoplay controlado (sin duplicados, con intervalo configurable) =====
(function galleryAutoplay() {
  const wrap = document.querySelector(".gallery-carousel");
  if (!wrap) return;

  // Evitar doble inicialización
  if (wrap.dataset.autoplayInit === "1") return;
  wrap.dataset.autoplayInit = "1";

  const slides = Array.from(wrap.querySelectorAll(".g-slide"));
  if (slides.length <= 1) return;

  // Permite setear <div class="gallery-carousel" data-interval="12000">
  const INTERVAL = Math.max(1000, parseInt(wrap.dataset.interval || "12000", 10));

  const prevBtn = wrap.querySelector(".g-prev");
  const nextBtn = wrap.querySelector(".g-next");

  // Si ninguna está activa, activar la primera
  let i = slides.findIndex(s => s.classList.contains("active"));
  if (i < 0) { i = 0; slides[0].classList.add("active"); }

  // Guardar el timer en la instancia para poder limpiarlo si se re-ejecuta
  if (wrap._autoplayTimer) clearInterval(wrap._autoplayTimer);
  let timer = null;

  function show(n) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === n));
    i = n;
  }
  function next() { show((i + 1) % slides.length); }
  function prev() { show((i - 1 + slides.length) % slides.length); }

  function start() {
    stop();
    wrap._autoplayTimer = timer = setInterval(next, INTERVAL);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  prevBtn?.addEventListener("click", () => { prev(); start(); });
  nextBtn?.addEventListener("click", () => { next(); start(); });
  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);

  // Swipe táctil
  let startX = 0, dx = 0, touching = false;
  wrap.addEventListener("touchstart", (e) => { touching = true; startX = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
  wrap.addEventListener("touchmove", (e) => { if (touching) dx = e.touches[0].clientX - startX; }, { passive: true });
  wrap.addEventListener("touchend", () => { touching = false; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); start(); });

  console.log("Gallery autoplay running at", INTERVAL, "ms");
  show(i);
  start();
})();


// Animaciones de entrada (reveal + stagger)
(function revealAnimations() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = Array.from(document.querySelectorAll('.reveal, .stagger'));
  if (!targets.length) return;

  // Si el usuario prefiere menos movimiento, mostramos todo y salimos
  if (reduce) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;

      // Activar stagger si procede
      if (el.classList.contains('stagger')) {
        const gap = Number(el.dataset.stagger ?? 80);   // ms entre hijos
        const base = Number(el.dataset.delay ?? 0);     // retraso inicial
        Array.from(el.children).forEach((child, i) => {
          child.style.transitionDelay = `${base + i * gap}ms`;
        });
      } else {
        // Elementos reveal individuales
        const d = Number(el.dataset.delay ?? 0);
        el.style.transitionDelay = `${d}ms`;
      }

      el.classList.add('is-visible');
      io.unobserve(el); // ya no necesita observarse
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  targets.forEach((el) => io.observe(el));
})();


// ===== i18n básico (ES/EN/FR/DE) =====
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Tabla de traducciones
  const I18N = {
    es: {
      gallery_title: "Galería",          // en: "Gallery", fr: "Galerie", de: "Galerie"
      hours_title: "Horario",            // en: "Hours", fr: "Horaires", de: "Zeiten"
      hours_mon: "Lunes: 16:00 – 21:00",
      hours_week: "Mar–Vie: 9:45 – 14:00 / 16:00 – 21:00",
      hours_weekend: "Sáb–Dom: Cerrado",
      hours_quote: "«El tiempo dedicado a ti mismo nunca es tiempo perdido»",
      contact_title: "Contacto",         // en: "Contact", fr: "Contact", de: "Kontakt"
      contact_blurb: "Encuéntranos en San Juan de Mozarrifar, Zaragoza. Llámanos, escríbenos por WhatsApp o ven a visitarnos.",
      btn_whatsapp: "WhatsApp",
      btn_directions: "Cómo llegar",
      footer_copy: "© 2025 Barbería Hugo — Todos los derechos reservados",
      // Meta / generales
      meta_title: "Barbería Hugo | Cortes, Barba y Estilo en Zaragoza",
      meta_desc: "Barbería Hugo en Zaragoza. Cortes clásicos y modernos, afeitado a navaja y arreglos de barba. Reserva fácil por WhatsApp.",
      tagline: "Donde el estilo se convierte en identidad",
      // Nav
      nav_home: "Inicio",
      nav_services: "Servicios",
      nav_gallery: "Galería",
      nav_hours: "Horario",
      nav_contact: "Contacto",
      // Secciones
      reviews_title: "Lo que nuestros clientes dicen",
      // Servicios UI
      svc_when_label: "Fecha y hora preferida",
      svc_total: "Total:",
      svc_add: "Añadir",
      svc_remove: "Quitar",
      svc_reserve_whatsapp: "Reservar por WhatsApp",
      svc_no_date: "Sin fecha/hora",
      svc_msg_header: "Hola, me gustaría reservar:",
      svc_msg_total: "Total aprox.:",
      svc_msg_when: "Fecha/hora preferida:",
      svc_msg_footer: "¿Hay disponibilidad? ¡Gracias!",
      // Catálogo
      svc_catalog: {
        corte: "Corte clásico",
        fade: "Corte fade",
        barba: "Arreglo de barba",
        afeitado: "Afeitado a navaja",
        combo: "Corte + Barba",
        nino: "Corte niño",
      },
      aria_carousel: "Carrusel de opiniones de clientes",
      stars_label: (n = 5) => `${n} de 5`,
    },
    en: {
      gallery_title: "Gallery",
      hours_title: "Hours",
      hours_mon: "Monday: 16:00 – 21:00",
      hours_week: "Tue–Fri: 9:45 – 14:00 / 16:00 – 21:00",
      hours_weekend: "Sat–Sun: Closed",
      hours_quote: "“Time spent on yourself is never wasted”",
      contact_title: "Contact",
      contact_blurb: "Find us in San Juan de Mozarrifar, Zaragoza. Call us, write on WhatsApp or come visit us.",
      btn_whatsapp: "WhatsApp",
      btn_directions: "Directions",
      footer_copy: "© 2025 Hugo Barbershop — All rights reserved",
      meta_title: "Hugo Barbershop | Cuts, Beard & Style in Zaragoza",
      meta_desc: "Hugo Barbershop in Zaragoza. Classic and modern cuts, straight-razor shaves and beard trims. Easy booking via WhatsApp.",
      tagline: "Where style becomes identity",
      nav_home: "Home",
      nav_services: "Services",
      nav_gallery: "Gallery",
      nav_hours: "Hours",
      nav_contact: "Contact",
      reviews_title: "What our clients say",
      svc_when_label: "Preferred date & time",
      svc_total: "Total:",
      svc_add: "Add",
      svc_remove: "Remove",
      svc_reserve_whatsapp: "Book via WhatsApp",
      svc_no_date: "No date/time",
      svc_msg_header: "Hi, I'd like to book:",
      svc_msg_total: "Approx. total:",
      svc_msg_when: "Preferred date/time:",
      svc_msg_footer: "Is there availability? Thanks!",
      svc_catalog: {
        corte: "Classic haircut",
        fade: "Fade haircut",
        barba: "Beard trim",
        afeitado: "Straight-razor shave",
        combo: "Haircut + Beard",
        nino: "Kids haircut",
      },
      aria_carousel: "Customer reviews carousel",
      stars_label: (n = 5) => `${n} out of 5`,
    },
    fr: {
      hours_title: "Horaires",
      hours_mon: "Lundi : 16h00 – 21h00",
      hours_week: "Mar–Ven : 9h45 – 14h00 / 16h00 – 21h00",
      hours_weekend: "Sam–Dim : Fermé",
      hours_quote: "« Le temps consacré à soi-même n’est jamais perdu »",
      gallery_title: "Galerie",
      hours_title: "Horaires",
      contact_title: "Contact",
      contact_blurb: "Retrouvez-nous à San Juan de Mozarrifar, Saragosse. Appelez-nous, écrivez sur WhatsApp ou venez nous rendre visite.",
      btn_whatsapp: "WhatsApp",
      btn_directions: "Comment y arriver",
      footer_copy: "© 2025 Barbería Hugo — Tous droits réservés",
      tagline: "Là où le style devient identité",
      nav_home: "Accueil",
      nav_services: "Services",
      nav_gallery: "Galerie",
      nav_hours: "Horaires",
      nav_contact: "Contact",
      reviews_title: "Ce que disent nos clients",
      svc_when_label: "Date et heure souhaitées",
      svc_total: "Total :",
      svc_add: "Ajouter",
      svc_remove: "Retirer",
      svc_reserve_whatsapp: "Réserver par WhatsApp",
      meta_title: "Barbería Hugo | Coupes, Barbe & Style à Saragosse",
      meta_desc: "Barbería Hugo à Saragosse. Coupes classiques et modernes, rasage au coupe-chou et taille de barbe. Réservation facile par WhatsApp.",
      tagline: "Là où le style devient identité",
      nav_home: "Accueil",
      nav_services: "Services",
      nav_gallery: "Galerie",
      nav_hours: "Horaires",
      nav_contact: "Contact",
      reviews_title: "Ce que disent nos clients",
      svc_when_label: "Date et heure préférées",
      svc_total: "Total :",
      svc_add: "Ajouter",
      svc_remove: "Retirer",
      svc_reserve_whatsapp: "Réserver via WhatsApp",
      svc_no_date: "Sans date/heure",
      svc_msg_header: "Bonjour, j’aimerais réserver :",
      svc_msg_total: "Total approx. :",
      svc_msg_when: "Date/heure préférées :",
      svc_msg_footer: "Y a-t-il de la disponibilité ? Merci !",
      svc_catalog: {
        corte: "Coupe classique",
        fade: "Coupe dégradée",
        barba: "Taille de barbe",
        afeitado: "Rasage au coupe-chou",
        combo: "Coupe + Barbe",
        nino: "Coupe enfant",
      },
      aria_carousel: "Carrousel d’avis clients",
      stars_label: (n = 5) => `${n} sur 5`,
    },
    de: {
      hours_title: "Öffnungszeiten",
      hours_mon: "Montag: 16:00 – 21:00",
      hours_week: "Di–Fr: 9:45 – 14:00 / 16:00 – 21:00",
      hours_weekend: "Sa–So: Geschlossen",
      hours_quote: "„Zeit für dich selbst ist nie vergeudet“",
      gallery_title: "Galerie",
      hours_title: "Zeiten",
      contact_title: "Kontakt",
      contact_blurb: "Besuchen Sie uns in San Juan de Mozarrifar, Saragossa. Rufen Sie uns an, schreiben Sie über WhatsApp oder kommen Sie vorbei.",
      btn_whatsapp: "WhatsApp",
      btn_directions: "Anfahrt",
      footer_copy: "© 2025 Barbería Hugo — Alle Rechte vorbehalten",
      tagline: "Wo Stil zur Identität wird",
      nav_home: "Start",
      nav_services: "Dienstleistungen",
      nav_gallery: "Galerie",
      nav_hours: "Öffnungszeiten",
      nav_contact: "Kontakt",
      reviews_title: "Was unsere Kunden sagen",
      svc_when_label: "Bevorzugtes Datum und Uhrzeit",
      svc_total: "Gesamt:",
      svc_add: "Hinzufügen",
      svc_remove: "Entfernen",
      svc_reserve_whatsapp: "Über WhatsApp reservieren",
      meta_title: "Hugo Barbershop | Haarschnitt, Bart & Stil in Saragossa",
      meta_desc: "Hugo Barbershop in Saragossa. Klassische & moderne Schnitte, Rasur mit Klinge und Bartservice. Einfache Buchung per WhatsApp.",
      tagline: "Wo Stil zur Identität wird",
      nav_home: "Start",
      nav_services: "Leistungen",
      nav_gallery: "Galerie",
      nav_hours: "Zeiten",
      nav_contact: "Kontakt",
      reviews_title: "Was unsere Kund:innen sagen",
      svc_when_label: "Bevorzugtes Datum & Uhrzeit",
      svc_total: "Summe:",
      svc_add: "Hinzufügen",
      svc_remove: "Entfernen",
      svc_reserve_whatsapp: "Per WhatsApp buchen",
      svc_no_date: "Kein Datum/Uhrzeit",
      svc_msg_header: "Hallo, ich möchte buchen:",
      svc_msg_total: "Ca. Summe:",
      svc_msg_when: "Bevorzugte Zeit:",
      svc_msg_footer: "Gibt es Verfügbarkeit? Danke!",
      svc_catalog: {
        corte: "Klassischer Haarschnitt",
        fade: "Fade-Haarschnitt",
        barba: "Bart trimmen",
        afeitado: "Rasur mit Klinge",
        combo: "Haarschnitt + Bart",
        nino: "Kinderhaarschnitt",
      },
      aria_carousel: "Kundenbewertungen Karussell",
      stars_label: (n = 5) => `${n} von 5`,
    }
  };



  // Estado de idioma
  let currentLang = (localStorage.getItem("lang") || navigator.language || "es").slice(0, 2);
  if (!I18N[currentLang]) currentLang = "es";

  // Utilidades de formato (moneda / fecha) dependientes de idioma
  const formatEUR = (n) => new Intl.NumberFormat(currentLang, { style: "currency", currency: "EUR" }).format(n);
  const formatDate = (d) => d.toLocaleDateString(currentLang);
  const formatTime = (d) => d.toLocaleTimeString(currentLang, { hour: "2-digit", minute: "2-digit" });

  // Aplicar traducciones a nodos con data-i18n / data-i18n-meta
  function applyI18n(lang) {
    const dict = I18N[lang] || I18N.es;
    document.documentElement.lang = lang;

    // Textos visibles
    $$("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = typeof dict[key] === "function" ? dict[key]() : dict[key];
    });

    // Meta y título
    $$("[data-i18n-meta]").forEach(el => {
      const key = el.getAttribute("data-i18n-meta");
      if (dict[key] != null) el.setAttribute("content", dict[key]);
    });
    const titleEl = $("title[data-i18n='meta_title']");
    if (titleEl && dict.meta_title) titleEl.textContent = dict.meta_title;

    // Carrusel: aria labels de accesibilidad
    const carousel = document.querySelector(".carousel");
    if (carousel && dict.aria_carousel) {
      carousel.setAttribute("aria-label", dict.aria_carousel);
    }
    $$(".stars[aria-label]").forEach(st => st.setAttribute("aria-label", dict.stars_label?.(5) || "5/5"));

    // Actualizar botones del selector de idioma (pressed)
    $$(".lang-switch [data-lang]").forEach(btn => {
      const isActive = btn.getAttribute("data-lang") === lang;
      btn.setAttribute("aria-pressed", String(isActive));
    });

    // Re-render de Servicios para nombres/etiquetas
    renderServicesI18n();
  }

  // Inyección/actualización del bloque de “Servicios” con textos traducidos
  function renderServicesI18n() {
    const host = document.querySelector("#servicios");
    if (!host) return;

    // Encontrar contenedor y partes ya creadas por tu lógica original
    const wrap = host.querySelector(".svc-wrap");
    if (!wrap) return;

    const dict = I18N[currentLang] || I18N.es;
    const grid = wrap.querySelector(".svc-grid");
    const amountEl = wrap.querySelector(".svc-amount");
    const dtLabel = wrap.querySelector(".svc-when label");
    const dtInput = wrap.querySelector(".svc-dt");
    const waBtn = wrap.querySelector(".svc-wa");

    // 1) Reconstruir tarjetas con nombres traducidos + botones "Añadir/Quitar"
    const CATALOG_KEYS = [
      { id: "corte", price: 12 },
      { id: "fade", price: 14 },
      { id: "barba", price: 10 },
      { id: "afeitado", price: 11 },
      { id: "combo", price: 20 },
      { id: "nino", price: 9 },
    ];

    // Recuperar selección actual si existe
    const selected = new Set(
      Array.from(grid.querySelectorAll("button.active")).map(btn => btn.getAttribute("data-id"))
    );

    grid.innerHTML = "";
    CATALOG_KEYS.forEach((svc) => {
      const name = dict.svc_catalog[svc.id] || svc.id;
      const card = document.createElement("article");
      card.className = "svc-card";
      card.innerHTML = `
        <h3>${name}</h3>
        <div class="price">${formatEUR(svc.price)}</div>
        <button type="button" data-id="${svc.id}" aria-pressed="false">${dict.svc_add}</button>
      `;
      const btn = card.querySelector("button");
      if (selected.has(svc.id)) {
        btn.classList.add("active");
        btn.textContent = dict.svc_remove;
        btn.setAttribute("aria-pressed", "true");
      }
      btn.addEventListener("click", () => {
        const isActive = btn.classList.toggle("active");
        btn.textContent = isActive ? dict.svc_remove : dict.svc_add;
        btn.setAttribute("aria-pressed", String(isActive));
        if (isActive) selected.add(svc.id); else selected.delete(svc.id);
        updateTotal();
      });
      grid.appendChild(card);
    });

    function updateTotal() {
      const total = CATALOG_KEYS
        .filter(s => selected.has(s.id))
        .reduce((a, b) => a + b.price, 0);
      amountEl.textContent = formatEUR(total);
    }
    updateTotal();

    // 2) Etiquetas inferiores traducidas
    if (dtLabel) dtLabel.textContent = dict.svc_when_label;
    if (waBtn) waBtn.textContent = dict.svc_reserve_whatsapp;

    // 3) Click de WhatsApp (único y limpio)
    if (waBtn) {
      // eliminar posibles listeners previos clonando el botón
      const cleanBtn = waBtn.cloneNode(true);
      waBtn.replaceWith(cleanBtn);

      cleanBtn.addEventListener("click", () => {
        const chosen = CATALOG_KEYS.filter((s) => selected.has(s.id));
        if (!chosen.length) { alert("Selecciona al menos un servicio."); return; }

        const dtVal = dtInput?.value ? new Date(dtInput.value) : null;
        const whenTxt = dtVal ? `${formatDate(dtVal)} ${formatTime(dtVal)}`
          : (I18N[currentLang]?.svc_no_date || "—");

        const lines = [
          dict.svc_msg_header,
          ...chosen.map((s) => `• ${(dict.svc_catalog[s.id] || s.id)} — ${formatEUR(s.price)}`),
          `${dict.svc_msg_total} ${formatEUR(chosen.reduce((a, b) => a + b.price, 0))}`,
          `${dict.svc_msg_when} ${whenTxt}`,
          "",
          dict.svc_msg_footer
        ];

        const waCTA = document.querySelector(".whatsapp-btn.grande");
        const waHref = waCTA?.getAttribute("href") || "";
        const waNumber = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "34123456789";

        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
        window.open(url, "_blank", "noopener");
      });
    }

    // Tomamos el número actual desde el enlace existente (si lo tienes en tu HTML)
    const waCTA = document.querySelector(".whatsapp-btn.grande");
    const waHref = waCTA?.getAttribute("href") || "";
    const waNumber = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "34123456789";

    // (El resto del código de WhatsApp click handler ya está gestionado arriba)
  }

  // Eventos de la UI de idiomas
  function bindLangSwitch() {
    const btns = $$(".lang-switch [data-lang]");
    if (!btns.length) return;
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("data-lang");
        if (!I18N[next]) return;
        currentLang = next;
        localStorage.setItem("lang", currentLang);
        applyI18n(currentLang);
      });
    });
  }

  // Inicializar
  function initI18n() {
    // Si tu JS previo creó el bloque de servicios, aplicamos traducciones después de DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        bindLangSwitch();
        applyI18n(currentLang);
      });
    } else {
      bindLangSwitch();
      applyI18n(currentLang);
    }
  }

  initI18n();
})();

console.log("%cSitio diseñado por delysz — https://github.com/delysz", "color: #f6c90e; font-size:14px;");