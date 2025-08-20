// =================================================================
//  BARBERÍA HUGO - SCRIPT PRINCIPAL UNIFICADO
// =================================================================
//  Autor: delysz (https://github.com/delysz)
//  Descripción: Este archivo contiene toda la lógica funcional
//  de la web, unificando carruseles, galería, traducciones y
//  otras interacciones para evitar conflictos y mejorar el
//  rendimiento.
// =================================================================

(() => {
  "use strict";

  // --- Utilidades comunes ---
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const encode = (s) => encodeURIComponent(String(s ?? ""));

  // =================================
  //  1. CARRUSEL DE RESEÑAS
  // =================================
  (function carousel() {
    const root = $(".carousel");
    if (!root) return;

    const items = $$(".carousel-item", root);
    const prevBtn = $(".carousel-btn.prev", root);
    const nextBtn = $(".carousel-btn.next", root);
    if (items.length <= 1) return;

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
    on(root, "touchstart", (e) => { touching = true; startX = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
    on(root, "touchmove", (e) => { if (!touching) return; dx = e.touches[0].clientX - startX; }, { passive: true });
    on(root, "touchend", () => { touching = false; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); play(); });

    show(idx);
    play();
  })();

  // =================================
  //  2. NAVEGACIÓN CON SCROLL SUAVE
  // =================================
  (function smoothScrollAndActiveNav() {
    const links = $$("nav a[href^='#']");
    if (!links.length) return;

    links.forEach((a) => a.addEventListener("click", (e) => {
      const isHome = a.getAttribute("data-i18n") === "nav_home";
      const id = a.getAttribute("href");
      const target = id ? $(id) : null;

      if (isHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (history.replaceState) {
          history.replaceState(null, "", location.pathname + location.search);
        }
        return;
      }

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (history.pushState) {
          history.pushState(null, "", id);
        }
      }
    }));

    const sections = links.map((a) => a.getAttribute("href")).filter(Boolean).map((id) => ({ id, el: $(id) })).filter((x) => x.el);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = "#" + en.target.id;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });

    sections.forEach(({ el }) => io.observe(el));
  })();

  // ===============================================
  //  3. SISTEMA DE TRADUCCIONES (i18n) - ÚNICO Y CENTRALIZADO
  // ===============================================
  (function i18nSystem() {
    const I18N = {
      es: {
        gallery_title: "Galería",
        hours_title: "Horario",
        hours_mon: "Lunes: 16:00 – 21:00",
        hours_week: "Mar–Vie: 9:45 – 14:00 / 16:00 – 21:00",
        hours_weekend: "Sáb–Dom: Cerrado",
        hours_quote: "«El tiempo dedicado a ti mismo nunca es tiempo perdido»",
        contact_title: "Contacto",
        contact_blurb: "Encuéntranos en San Juan de Mozarrifar, Zaragoza. Llámanos, escríbenos por WhatsApp o ven a visitarnos.",
        btn_whatsapp: "WhatsApp",
        btn_directions: "Cómo llegar",
        footer_copy: "© 2025 Barbería Hugo — Todos los derechos reservados",
        meta_title: "Barbería Hugo | Cortes, Barba y Estilo en Zaragoza",
        meta_desc: "Barbería Hugo en Zaragoza. Cortes clásicos y modernos, afeitado a navaja y arreglos de barba. Reserva fácil por WhatsApp.",
        tagline: "Donde el estilo se convierte en identidad",
        nav_home: "Inicio",
        nav_services: "Servicios",
        nav_gallery: "Galería",
        nav_hours: "Horario",
        nav_contact: "Contacto",
        reviews_title: "Lo que nuestros clientes dicen",
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
        gallery_title: "Galerie",
        hours_title: "Horaires",
        hours_mon: "Lundi : 16h00 – 21h00",
        hours_week: "Mar–Ven : 9h45 – 14h00 / 16h00 – 21h00",
        hours_weekend: "Sam–Dim : Fermé",
        hours_quote: "« Le temps consacré à soi-même n’est jamais perdu »",
        contact_title: "Contact",
        contact_blurb: "Retrouvez-nous à San Juan de Mozarrifar, Saragosse. Appelez-nous, écrivez sur WhatsApp ou venez nous rendre visite.",
        btn_whatsapp: "WhatsApp",
        btn_directions: "Comment y arriver",
        footer_copy: "© 2025 Barbería Hugo — Tous droits réservés",
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
        gallery_title: "Galerie",
        hours_title: "Öffnungszeiten",
        hours_mon: "Montag: 16:00 – 21:00",
        hours_week: "Di–Fr: 9:45 – 14:00 / 16:00 – 21:00",
        hours_weekend: "Sa–So: Geschlossen",
        hours_quote: "„Zeit für dich selbst ist nie vergeudet“",
        contact_title: "Kontakt",
        contact_blurb: "Besuchen Sie uns in San Juan de Mozarrifar, Saragossa. Rufen Sie uns an, schreiben Sie über WhatsApp oder kommen Sie vorbei.",
        btn_whatsapp: "WhatsApp",
        btn_directions: "Anfahrt",
        footer_copy: "© 2025 Barbería Hugo — Alle Rechte vorbehalten",
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

    let currentLang = (localStorage.getItem("lang") || navigator.language || "es").slice(0, 2);
    if (!I18N[currentLang]) currentLang = "es";

    const formatEUR = (n) => new Intl.NumberFormat(currentLang, { style: "currency", currency: "EUR" }).format(n);
    const formatDate = (d) => d.toLocaleDateString(currentLang, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (d) => d.toLocaleTimeString(currentLang, { hour: "2-digit", minute: "2-digit" });

    function applyI18n(lang) {
      const dict = I18N[lang] || I18N.es;
      document.documentElement.lang = lang;

      $$("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key] != null) el.textContent = typeof dict[key] === "function" ? dict[key]() : dict[key];
      });

      $$("[data-i18n-meta]").forEach(el => {
        const key = el.getAttribute("data-i18n-meta");
        if (dict[key] != null) el.setAttribute("content", dict[key]);
      });
      const titleEl = $("title[data-i18n='meta_title']");
      if (titleEl && dict.meta_title) titleEl.textContent = dict.meta_title;

      const carousel = $(".carousel");
      if (carousel && dict.aria_carousel) carousel.setAttribute("aria-label", dict.aria_carousel);

      $$(".stars[aria-label]").forEach(st => st.setAttribute("aria-label", dict.stars_label?.(5) || "5/5"));

      // La sección de servicios se actualiza a través de su propia lógica
      if (typeof window.renderServicesI18n === 'function') {
        window.renderServicesI18n(lang);
      }
    }

    function updateLangUI(lang) {
      const toggle = $(".lang-toggle img");
      const optImg = $(`.lang-menu [data-lang="${lang}"] img`);
      if (toggle && optImg) {
        toggle.src = optImg.src;
        toggle.alt = optImg.alt || lang;
      }
      $$(".lang-menu [data-lang]").forEach(btn => {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
      });
    }

    function bindLangSwitch() {
      const dd = $(".lang-dropdown");
      if (!dd) return;
      const toggle = dd.querySelector(".lang-toggle");
      const menu = dd.querySelector(".lang-menu");

      const open = () => { dd.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); }
      const close = () => { dd.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }

      on(toggle, "click", (e) => {
        e.stopPropagation();
        dd.classList.contains("open") ? close() : open();
      });

      on(menu, "click", (e) => {
        const btn = e.target.closest("[data-lang]");
        if (!btn) return;
        const nextLang = btn.getAttribute("data-lang");
        if (!I18N[nextLang] || nextLang === currentLang) {
          close();
          return;
        }
        currentLang = nextLang;
        localStorage.setItem("lang", currentLang);
        applyI18n(currentLang);
        updateLangUI(currentLang);
        close();
      });

      on(document, "click", (e) => {
        if (dd.classList.contains("open") && !dd.contains(e.target)) close();
      });
      on(document, "keydown", (e) => { if (e.key === "Escape") close(); });
    }

    // Hacemos el diccionario accesible globalmente para otros módulos
    window.I18N = I18N;

    // --- Inicialización ---
    function init() {
      bindLangSwitch();
      applyI18n(currentLang);
      updateLangUI(currentLang);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();


  // ===============================================
  //  4. SERVICIOS DINÁMICOS Y RESERVA WHATSAPP
  // ===============================================
  (function services() {
    const host = $("#servicios");
    if (!host) return;
    if (host.querySelector(".svc-wrap")) return;

    const CATALOG_DATA = [
      { id: "corte", price: 12 }, { id: "fade", price: 14 },
      { id: "barba", price: 10 }, { id: "afeitado", price: 11 },
      { id: "combo", price: 20 }, { id: "nino", price: 9 },
    ];

    const selected = new Set();
    let currentLang = (localStorage.getItem("lang") || "es").slice(0, 2);

    // Crear la estructura HTML una sola vez
    const wrap = document.createElement("div");
    wrap.className = "svc-wrap";
    wrap.innerHTML = `
      <div class="svc-grid"></div>
      <div class="svc-bar">
        <div class="svc-when">
          <label></label>
          <input type="datetime-local" class="svc-dt">
        </div>
        <div class="svc-total"><span></span> <strong class="svc-amount"></strong></div>
        <button type="button" class="svc-wa"></button>
      </div>`;
    host.appendChild(wrap);

    const grid = $(".svc-grid", wrap);
    const amountEl = $(".svc-amount", wrap);
    const totalLabel = $(".svc-total span", wrap);
    const dtLabel = $(".svc-when label", wrap);
    const dtInput = $(".svc-dt", wrap);
    const waBtn = $(".svc-wa", wrap);

    const formatEUR = (n, lang) => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }).format(n);

    function updateTotal(lang) {
      const dict = window.I18N[lang] || window.I18N.es;
      const total = CATALOG_DATA.filter((s) => selected.has(s.id)).reduce((a, b) => a + b.price, 0);
      totalLabel.textContent = dict.svc_total;
      amountEl.textContent = formatEUR(total, lang);
    }

    // Exponemos la función de renderizado para que el sistema i18n pueda llamarla
    // Exponemos la función de renderizado para que el sistema i18n pueda llamarla
    window.renderServicesI18n = function (lang) {
      currentLang = lang;
      const dict = window.I18N[lang] || window.I18N.es;

      // Asegura animación por stagger en la cuadrícula
      grid.classList.add("stagger");
      grid.dataset.stagger = "90";   // gap entre hijos (ms)
      grid.dataset.delay = "120";    // retardo base (ms)

      grid.innerHTML = "";
      CATALOG_DATA.forEach((svc) => {
        const name = dict.svc_catalog[svc.id] || svc.id;
        const card = document.createElement("article");
        card.className = "svc-card";
        const isSelected = selected.has(svc.id);

        card.innerHTML = `
      <h3>${name}</h3>
      <div class="price">${formatEUR(svc.price, lang)}</div>
      <button type="button" data-id="${svc.id}" aria-pressed="${isSelected}">
        ${isSelected ? dict.svc_remove : dict.svc_add}
      </button>`;

        const btn = $("button", card);
        if (isSelected) btn.classList.add("active");

        on(btn, "click", () => {
          const isActive = btn.classList.toggle("active");
          btn.textContent = isActive ? dict.svc_remove : dict.svc_add;
          btn.setAttribute("aria-pressed", String(isActive));
          if (isActive) selected.add(svc.id); else selected.delete(svc.id);
          updateTotal(lang);
        });

        grid.appendChild(card);
      });

      // Textos barra inferior + total
      $(".svc-when label", wrap).textContent = dict.svc_when_label;
      $(".svc-wa", wrap).textContent = dict.svc_reserve_whatsapp;
      updateTotal(lang);
    };


    on(waBtn, "click", () => {
      const dict = window.I18N[currentLang] || window.I18N.es;
      const chosen = CATALOG_DATA.filter((s) => selected.has(s.id));
      if (!chosen.length) { alert("Selecciona al menos un servicio."); return; }

      const dtVal = dtInput.value ? new Date(dtInput.value) : null;
      const whenTxt = dtVal ? `${dtVal.toLocaleDateString(currentLang)} ${dtVal.toLocaleTimeString(currentLang, { hour: "2-digit", minute: "2-digit" })}` : dict.svc_no_date;

      const total = chosen.reduce((a, b) => a + b.price, 0);

      const lines = [
        dict.svc_msg_header,
        ...chosen.map((s) => `• ${dict.svc_catalog[s.id]} — ${formatEUR(s.price, currentLang)}`),
        `${dict.svc_msg_total} ${formatEUR(total, currentLang)}`,
        `${dict.svc_msg_when} ${whenTxt}`,
        "",
        dict.svc_msg_footer
      ];

      const waCTA = $(".whatsapp-btn.grande");
      const waHref = waCTA?.getAttribute("href") || "";
      const waNumber = (waHref.match(/wa\.me\/(\d+)/) || [])[1] || "34651435444";
      const url = `https://wa.me/${waNumber}?text=${encode(lines.join("\n"))}`;
      window.open(url, "_blank", "noopener");
    });

    // Renderizado inicial
    window.renderServicesI18n(currentLang);
  })();

  // ===============================================
  //  5. GALERÍA CON LIGHTBOX (CORREGIDO) Y AUTOPLAY
  // ===============================================
  (function galleryFeatures() {
    // --- Autoplay ---
    const wrap = $(".gallery-carousel");
    if (!wrap) return;
    if (wrap.dataset.init === "1") return;
    wrap.dataset.init = "1";

    const slides = $$(".g-slide", wrap);
    if (slides.length <= 1) return;

    const INTERVAL = Math.max(1000, parseInt(wrap.dataset.interval || "9000", 10));
    const prevBtn = $(".g-prev", wrap);
    const nextBtn = $(".g-next", wrap);

    let i = slides.findIndex(s => s.classList.contains("active"));
    if (i < 0) { i = 0; slides[0].classList.add("active"); }

    let timer = null;

    function show(n) { slides.forEach((s, idx) => s.classList.toggle("active", idx === n)); i = n; }
    const next = () => show((i + 1) % slides.length);
    const prev = () => show((i - 1 + slides.length) % slides.length);
    const stop = () => { if (timer) clearInterval(timer); timer = null; }
    const start = () => { stop(); timer = setInterval(next, INTERVAL); }

    on(prevBtn, "click", () => { prev(); start(); });
    on(nextBtn, "click", () => { next(); start(); });
    on(wrap, "mouseenter", stop);
    on(wrap, "mouseleave", start);

    let startX = 0, dx = 0, touching = false;
    on(wrap, "touchstart", (e) => { touching = true; startX = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
    on(wrap, "touchmove", (e) => { if (touching) dx = e.touches[0].clientX - startX; }, { passive: true });
    on(wrap, "touchend", () => { touching = false; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); start(); });

    show(i);
    start();

    // --- Lightbox (integrado y corregido) ---
    let lb = $(".lightbox");
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.hidden = true;
      lb.innerHTML = `
        <button class="lb-close" aria-label="Cerrar">×</button>
        <img class="lb-img" alt="">
        <button class="lb-prev" aria-label="Anterior">❮</button>
        <button class="lb-next" aria-label="Siguiente">❯</button>`;
      document.body.appendChild(lb);
    }

    const imgEl = $(".lb-img", lb);
    const btnClose = $(".lb-close", lb);
    const btnLbPrev = $(".lb-prev", lb);
    const btnLbNext = $(".lb-next", lb);
    let currentIdx = -1;

    function openLightbox(index) {
      currentIdx = index;
      const a = slides[currentIdx];
      const full = a.getAttribute("data-full") || a.getAttribute("href");
      const alt = $("img", a)?.getAttribute("alt") || "";
      imgEl.src = full;
      imgEl.alt = alt;
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lb.hidden = true;
      imgEl.src = ""; // Libera memoria
      document.body.style.overflow = "";
    }

    const prevLightbox = () => openLightbox((currentIdx - 1 + slides.length) % slides.length);
    const nextLightbox = () => openLightbox((currentIdx + 1) % slides.length);

    on(wrap, "click", (e) => {
      const a = e.target.closest(".g-slide");
      if (!a) return;
      e.preventDefault();
      const index = slides.indexOf(a);
      if (index >= 0) openLightbox(index);
    });

    on(btnClose, "click", closeLightbox);
    on(btnLbPrev, "click", prevLightbox);
    on(btnLbNext, "click", nextLightbox);
    on(lb, "click", (e) => { if (e.target === lb) closeLightbox(); });
    on(window, "keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    });
  })();


  // =================================
  //  6. AVISO 'SÍGUENOS' (CTA)
  // =================================
  (function followCTA() {
    const footer = $("footer");
    if (!footer) return;

    let cta = $("#follow-cta");
    if (!cta) {
      cta = document.createElement("div");
      cta.id = "follow-cta";
      cta.className = "follow-cta";
      cta.hidden = true;
      cta.innerHTML = `
      <button class="cta-close" aria-label="Cerrar">×</button>
      <p>¡No te olvides de seguirnos en nuestras RRSS!</p>
      <div class="cta-actions">
        <a href="https://www.instagram.com/barberia_hugo_" target="_blank" rel="noopener" class="btn-cta ig"><img src="icons8-instagram.svg" alt="" aria-hidden="true"> Instagram</a>
        <a href="https://www.facebook.com/p/Hugo-Barberia-Campos-100058625056973/" target="_blank" rel="noopener" class="btn-cta fb"><img src="icons8-facebook-nuevo.svg" alt="" aria-hidden="true"> Facebook</a>
      </div>`;
      document.body.appendChild(cta);
    }

    const closeBtn = $(".cta-close", cta);
    let timer = null;
    const hideCTA = () => {
      cta.classList.remove("show");
      sessionStorage.setItem("ctaDismissed", "1");
      clearTimeout(timer);
      setTimeout(() => { cta.hidden = true; }, 200);
    };
    on(closeBtn, "click", hideCTA);

    const showCTA = () => {
      if (sessionStorage.getItem("ctaDismissed") || cta.classList.contains("show")) return;
      cta.hidden = false;
      requestAnimationFrame(() => cta.classList.add("show"));
    };
    const scheduleShow = () => { clearTimeout(timer); timer = setTimeout(showCTA, 3000); };
    const cancelShow = () => { clearTimeout(timer); timer = null; };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.isIntersecting ? scheduleShow() : cancelShow());
    }, { threshold: 0.1 });
    io.observe(footer);
  })();

  // =================================
  //  7. ANIMACIONES DE ENTRADA
  // =================================
  (function revealAnimations() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = $$('.reveal, .stagger');
    if (!targets.length || reduce) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.classList.contains('stagger')) {
          const gap = Number(el.dataset.stagger ?? 80);
          const base = Number(el.dataset.delay ?? 0);
          Array.from(el.children).forEach((child, i) => {
            child.style.transitionDelay = `${base + i * gap}ms`;
          });
        } else {
          el.style.transitionDelay = `${Number(el.dataset.delay ?? 0)}ms`;
        }
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    targets.forEach((el) => io.observe(el));
  })();

  // =================================
  //  8. EFECTOS "WOW" Y MISCELÁNEA
  // =================================
  (function miscAndWowEffects() {
    // Rel noopener para enlaces externos
    $$("a[target='_blank']").forEach((a) => {
      if (!/noopener/.test(a.rel)) a.rel = (a.rel ? a.rel + " " : "") + "noopener";
    });

    // Fallback para mapa de Google
    on($(".mapa iframe"), "error", (e) => {
      const backup = document.createElement("p");
      backup.innerHTML = `<a href="https://www.google.com/maps?q=41.7171479,-0.8414919" target="_blank">Abrir mapa en Google Maps</a>`;
      e.target.replaceWith(backup);
    });

    // Efectos que respetan 'prefers-reduced-motion'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Tilt del logo en hero
    const hero = $("header");
    const logo = $(".logo-barber");
    if (hero && logo) {
      on(hero, "mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        logo.style.transform = `rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateZ(0)`;
      });
      on(hero, "mouseleave", () => { logo.style.transform = "rotateX(0) rotateY(0)"; });
    }

    // Barra de progreso de scroll
    const bar = $("#scrollProgress");
    if (bar) {
      const updateProgress = () => {
        const h = document.documentElement;
        const scrolled = h.scrollTop || document.body.scrollTop;
        const max = (h.scrollHeight - h.clientHeight) || 1;
        bar.style.width = `${Math.min(100, (scrolled / max) * 100)}%`;
      };
      updateProgress();
      on(window, "scroll", updateProgress, { passive: true });
      on(window, "resize", updateProgress);
    }
  })();

  console.log("%cSitio diseñado por delysz — https://github.com/delysz", "color: #f6c90e; font-size:14px;");

})();