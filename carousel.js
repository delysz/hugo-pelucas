// =================================================================
//  BARBERÍA HUGO - SCRIPT PRINCIPAL UNIFICADO (VERSIÓN WHATSAPP)
// =================================================================
//  Autor: delysz (https://github.com/delysz)
//  Descripción: Este archivo contiene toda la lógica funcional
//  de la web, unificando carruseles, galería, traducciones y
//  la gestión de reservas redirigida a WhatsApp.
// =================================================================

(() => {
  "use strict";

  // --- Utilidades comunes ---
  const $ = (sel, root = document) => {
    if (!sel || typeof sel !== 'string') return null;
    if (/^https?:\/\//i.test(sel) || /</.test(sel)) return null;
    try { return root.querySelector(sel); } catch { return null; }
  };

  const $$ = (sel, root = document) => {
    if (!sel || typeof sel !== 'string') return [];
    if (/^https?:\/\//i.test(sel) || /</.test(sel)) return [];
    try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
  };

  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const encode = (s) => encodeURIComponent(String(s ?? ""));

  function attachTiltEffect(card) {
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;

      card.style.setProperty('--rotX', `${rotateX}deg`);
      card.style.setProperty('--rotY', `${rotateY}deg`);
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rotX', '0deg');
      card.style.setProperty('--rotY', '0deg');
    });
  }


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
      if (idx === i) return;

      const currentItem = items[idx];
      const nextItem = items[i];

      if (currentItem) {
        const currentText = currentItem.querySelector('.review-text');
        if (window.gsap) gsap.to(currentText, { opacity: 0, y: 10, duration: 0.3 });
      }

      items.forEach(el => el.classList.remove('active'));
      nextItem.classList.add('active');

      const nextText = nextItem.querySelector('.review-text');
      const nextAuthor = nextItem.querySelector('.review-author');

      if (window.gsap) {
        gsap.fromTo(nextText,
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 }
        );
        gsap.fromTo(nextAuthor,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, delay: 0.5 }
        );
      }

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
  //  3. SISTEMA DE TRADUCCIONES (i18n)
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
        svc_categories: {
          haircuts: "✂️ Cortes de pelo",
          combos: "💇‍♂️ Corte + barba",
          beard: "🧔 Servicios de barba",
          treatments: "🌟 Tratamientos",
          extras: "👁 Extras"
        },
        svc_catalog: {
          corte_normal: "Corte normal",
          corte_fade: "Corte Skin Fade",
          corte_nino_jubilado: "Niño o jubilado",
          combo_normal: "Corte normal + barba",
          combo_fade: "Skin Fade + barba",
          barba_arreglo: "Arreglo de barba",
          barba_afeitado: "Afeitado a navaja con vapor",
          trat_decoloracion: "Decoloración + color",
          trat_mechas: "Mechas",
          trat_peeling: "Peeling facial con vapor",
          extra_cejas: "Cejas"
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
        svc_categories: {
          haircuts: "✂️ Haircuts",
          combos: "💇‍♂️ Cut + beard",
          beard: "🧔 Beard services",
          treatments: "🌟 Treatments",
          extras: "👁 Extras"
        },
        svc_catalog: {
          corte_normal: "Standard haircut",
          corte_fade: "Skin fade",
          corte_nino_jubilado: "Kids/Seniors haircut",
          combo_normal: "Standard cut + beard",
          combo_fade: "Skin fade + beard",
          barba_arreglo: "Beard trim",
          barba_afeitado: "Straight-razor shave with steam",
          trat_decoloracion: "Bleach + color",
          trat_mechas: "Highlights",
          trat_peeling: "Facial peeling with steam",
          extra_cejas: "Eyebrows"
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
        svc_categories: {
          haircuts: "✂️ Coupes de cheveux",
          combos: "💇‍♂️ Coupe + barbe",
          beard: "🧔 Services de barbe",
          treatments: "🌟 Soins",
          extras: "👁 Extras"
        },
        svc_catalog: {
          corte_normal: "Coupe classique",
          corte_fade: "Dégradé américain (Skin Fade)",
          corte_nino_jubilado: "Enfant ou retraité",
          combo_normal: "Coupe classique + barbe",
          combo_fade: "Dégradé + barbe",
          barba_arreglo: "Taille de barbe",
          barba_afeitado: "Rasage à la lame avec vapeur",
          trat_decoloracion: "Décoloration + couleur",
          trat_mechas: "Mèches",
          trat_peeling: "Gommage facial à la vapeur",
          extra_cejas: "Sourcils"
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
        svc_categories: {
          haircuts: "✂️ Haarschnitte",
          combos: "💇‍♂️ Schnitt + Bart",
          beard: "🧔 Bartpflege",
          treatments: "🌟 Behandlungen",
          extras: "👁 Extras"
        },
        svc_catalog: {
          corte_normal: "Klassischer Haarschnitt",
          corte_fade: "Skin Fade",
          corte_nino_jubilado: "Kinder/Senioren Haarschnitt",
          combo_normal: "Klassischer Schnitt + Bart",
          combo_fade: "Skin Fade + Bart",
          barba_arreglo: "Bart trimmen",
          barba_afeitado: "Rasur mit Klinge und Dampf",
          trat_decoloracion: "Blondierung + Farbe",
          trat_mechas: "Strähnchen",
          trat_peeling: "Gesichtspeeling mit Dampf",
          extra_cejas: "Augenbrauen"
        },
        aria_carousel: "Kundenbewertungen Karussell",
        stars_label: (n = 5) => `${n} von 5`,
      }
    };

    let currentLang = (localStorage.getItem("lang") || navigator.language || "es").slice(0, 2);
    if (!I18N[currentLang]) currentLang = "es";

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

    window.I18N = I18N;

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
  //  4. SERVICIOS Y RESERVAS (VÍA WHATSAPP)
  // ===============================================
  (function services() {
    const host = $("#servicios");
    if (!host) return;
    if (host.querySelector(".svc-wrap")) return;

    const CATALOG_DATA = [
      { id: "corte_normal", price: 13, category: 'haircuts' },
      { id: "corte_fade", price: 15, category: 'haircuts' },
      { id: "corte_nino_jubilado", price: 13, category: 'haircuts' },
      { id: "combo_normal", price: 18, category: 'combos' },
      { id: "combo_fade", price: 20, category: 'combos' },
      { id: "barba_arreglo", price: 8, category: 'beard' },
      { id: "barba_afeitado", price: 12, category: 'beard' },
      { id: "trat_decoloracion", price: 28, category: 'treatments' },
      { id: "trat_mechas", price: 20, category: 'treatments' },
      { id: "trat_peeling", price: 9, category: 'treatments' },
      { id: "extra_cejas", price: 4, category: 'extras' },
    ];

    const selected = new Set();
    let currentLang = (localStorage.getItem("lang") || "es").slice(0, 2);
    if (!window.I18N || !window.I18N[currentLang]) currentLang = "es";

    const wrap = document.createElement("div");
    wrap.className = "svc-wrap";
    wrap.innerHTML = `
      <div class="svc-grid"></div>
      
      <div class="client-form" style="margin-top:20px; padding:20px; background:rgba(20, 25, 55, 0.6); border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
        <h3 style="font-size:1.1rem; color:#f6c90e; margin:0 0 15px 0; font-family:'Bebas Neue'; letter-spacing:1px;">1. Tu Nombre</h3>
        <input type="text" id="cli-name" placeholder="¿Cómo te llamas? *" style="width:100%; padding:10px; border-radius:6px; border:1px solid #444; background:#0f1220; color:white;">
      </div>

      <div class="svc-bar" style="display:block; margin-top:15px;">
        <h3 style="font-size:1.1rem; color:#f6c90e; margin:0 0 10px 0; font-family:'Bebas Neue'; letter-spacing:1px;">2. Elige Día y Hora Preferida</h3>
        
        <input type="date" id="date-picker" style="width:100%; padding:12px; background:#fff; color:#000; border-radius:6px; font-weight:bold; cursor:pointer;">
        
        <div id="slots-container" class="slots-grid">
            <p style="grid-column:1/-1; text-align:center; opacity:0.6; font-size:0.9rem;">👈 Selecciona un día primero</p>
        </div>

        <div class="svc-total" style="margin-top:20px; border-top:1px solid #333; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
             <span>Total aprox:</span> <strong class="svc-amount" style="font-size:1.4rem; color:#f6c90e">0€</strong>
        </div>
        <button type="button" class="svc-wa" style="width:100%; margin-top:10px;">Solicitar por WhatsApp</button>
      </div>`;
    host.appendChild(wrap);

    const grid = $(".svc-grid", wrap);
    const amountEl = $(".svc-amount", wrap);
    const waBtn = $(".svc-wa", wrap);
    const cliName = $("#cli-name", wrap);
    const datePicker = $("#date-picker", wrap);
    const slotsContainer = $("#slots-container", wrap);

    // --- BLOQUEAR FECHAS PASADAS ---
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    datePicker.min = `${year}-${month}-${day}`;
    // -------------------------------

    let finalDateTime = null;
    function generateSlots(dateStr) {
        slotsContainer.innerHTML = '';
        finalDateTime = null; 
        waBtn.textContent = "Elige una hora...";
        waBtn.disabled = true;

        const dateObj = new Date(dateStr);
        const day = dateObj.getDay(); 

        let ranges = [];
        if (day === 0 || day === 6) {
            slotsContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#ff6b6b">⛔ Cerrado los fines de semana.</p>';
            return;
        } else if (day === 1) { 
            ranges = [[16, 21]]; 
        } else { 
            ranges = [[10, 14], [16, 21]]; 
        }

        const slots = [];
        ranges.forEach(([startH, endH]) => {
            for (let h = startH; h < endH; h++) {
                for (let m = 0; m < 60; m += 20) {
                    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                }
            }
        });

        const now = new Date();
        const isToday = (dateStr === now.toISOString().split('T')[0]);
        const currentMins = now.getHours() * 60 + now.getMinutes();

        if (slots.length === 0) {
            slotsContainer.innerHTML = '<p>No hay horas disponibles.</p>';
            return;
        }

        slots.forEach(time => {
            const [h, m] = time.split(':').map(Number);
            const slotMins = h * 60 + m;

            const btn = document.createElement("div");
            btn.className = "time-btn";
            btn.textContent = time;

            if (isToday && slotMins < currentMins) {
                btn.classList.add("taken");
                btn.style.opacity = "0.3";
                btn.title = "Hora pasada";
            } else {
                btn.onclick = () => selectSlot(btn, dateStr, time);
            }

            slotsContainer.appendChild(btn);
        });
    }

    function selectSlot(btn, dateStr, time) {
        $$(".time-btn.selected", slotsContainer).forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        finalDateTime = `${dateStr}T${time}`;
        waBtn.textContent = "Solicitar Reserva por WhatsApp";
        waBtn.disabled = false;
    }

    datePicker.addEventListener('change', (e) => {
        if(e.target.value) generateSlots(e.target.value);
    });

    const formatEUR = (n, lang) => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }).format(n);
    
    function updateTotal(lang) {
      const dict = window.I18N[lang] || window.I18N.es;
      const total = CATALOG_DATA.filter((s) => selected.has(s.id)).reduce((a, b) => a + b.price, 0);
      amountEl.textContent = formatEUR(total, lang);
    }

    window.renderServicesI18n = function (lang) {
      currentLang = lang;
      const dict = window.I18N[lang] || window.I18N.es;
      const servicesByCategory = CATALOG_DATA.reduce((acc, svc) => {
        const cat = svc.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(svc);
        return acc;
      }, {});

      grid.innerHTML = "";
      ['haircuts', 'combos', 'beard', 'treatments', 'extras'].forEach(catId => {
        if (!servicesByCategory[catId]) return;
        const h3 = document.createElement('h3');
        h3.className = 'svc-category-title';
        h3.textContent = (dict.svc_categories[catId] || catId).replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        grid.appendChild(h3);

        servicesByCategory[catId].forEach((svc) => {
          const card = document.createElement("article");
          card.className = "svc-card";
          const isSelected = selected.has(svc.id);
          card.innerHTML = `
            <h3>${(dict.svc_catalog[svc.id] || svc.id).replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()}</h3>
            <div class="price">${formatEUR(svc.price, lang)}</div>
            <button type="button" data-id="${svc.id}" aria-pressed="${isSelected}">
              ${isSelected ? dict.svc_remove : dict.svc_add}
            </button>`;
          
          const btn = $("button", card);
          if (isSelected) btn.classList.add("active");
          on(btn, "click", () => {
            const active = btn.classList.toggle("active");
            btn.textContent = active ? dict.svc_remove : dict.svc_add;
            if (active) selected.add(svc.id); else selected.delete(svc.id);
            updateTotal(lang);
          });
          grid.appendChild(card);
        });
      });
      waBtn.textContent = "Elige una hora...";
      waBtn.disabled = true;
      updateTotal(lang);
    };

    on(waBtn, "click", () => {
        const nombre = cliName.value.trim();

        if (nombre.length < 2) { 
            alert("⚠️Falta tu nombre. Rellénalo para poder cerrar la cita.⚠️"); 
            cliName.focus(); 
            return; 
        }

        if (!finalDateTime) { alert("⚠️Selecciona un día y una hora en el calendario.⚠️"); return; }
        
        const chosen = CATALOG_DATA.filter((s) => selected.has(s.id));
        if (!chosen.length) { alert("⚠️Añade al menos un servicio antes de reservar.⚠️"); return; }

        const total = chosen.reduce((a, b) => a + b.price, 0);
        const dict = window.I18N[currentLang] || window.I18N.es;
        const serviciosTexto = chosen.map(s => dict.svc_catalog[s.id] || s.id).join(", ");

        const [fecha, hora] = finalDateTime.split('T');
        const [yy, mm, dd] = fecha.split('-');
        const fechaFormateada = `${dd}/${mm}/${yy}`;

        const mensaje = `Hola, Hugo! Quiero solicitar una cita.

        DATOS DE LA RESERVA:
        - Cliente: ${nombre}
        - Fecha: ${fechaFormateada}
        - Hora: ${hora}
        - Servicios: ${serviciosTexto}
        - Total: ${total}€

        Confírmame si tienes el hueco disponible. Un saludo.`;

        const telefonoEmpresa = "34651435444";
        const url = `https://wa.me/${telefonoEmpresa}?text=${encodeURIComponent(mensaje)}`;
        
        window.open(url, '_blank');
    });

    if (window.I18N) window.renderServicesI18n(currentLang);
  })();

  // ===============================================
  //  5. GALERÍA CON LIGHTBOX Y AUTOPLAY
  // ===============================================
  (function galleryFeatures() {
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
      imgEl.src = "";
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
    $$("a[target='_blank']").forEach((a) => {
      if (!/noopener/.test(a.rel)) a.rel = (a.rel ? a.rel + " " : "") + "noopener";
    });

    on($(".mapa iframe"), "error", (e) => {
      const backup = document.createElement("p");
      backup.innerHTML = `<a href="https://www.google.com/maps?q=41.7171479,-0.8414919" target="_blank">Abrir mapa en Google Maps</a>`;
      e.target.replaceWith(backup);
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const hero = $("header");
    const logo = $(".logo-barber");
    if (hero && logo) {
      on(logo, "mouseenter", () => logo.classList.add("hover-shine"));
      on(logo, "animationend", (e) => { if (e.animationName === "logoShine") logo.classList.remove("hover-shine"); });

      const hasGSAP = typeof window.gsap !== 'undefined' && !reduce;

      if (hasGSAP) {
        const tlHover = gsap.timeline({ paused: true });
        tlHover.to(logo, { duration: 0.35, scale: 1.04, filter: "drop-shadow(0 16px 36px rgba(246,201,14,0.55))" }, 0)
          .to(logo, { duration: 0.35, rotateZ: -2 }, 0)
          .to(document.documentElement, { duration: 0.35, "--ring-opacity": 0.95, "--ring-scale": 1, ease: "power2.out" }, 0);

        let ringTween = null;

        const activate = () => {
          tlHover.play();
          ringTween = gsap.to(document.documentElement, { "--ring-angle": "+=1turn", duration: 4, ease: "none", repeat: -1 });
        };
        const deactivate = () => {
          tlHover.reverse();
          if (ringTween) { ringTween.kill(); ringTween = null; }
          gsap.to(document.documentElement, { duration: 0.4, "--ring-opacity": 0, "--ring-scale": 0.92, overwrite: true });
        };

        on(logo, "mouseenter", activate);
        on(logo, "mouseleave", deactivate);

        on(logo, "touchstart", () => {
          activate();
          setTimeout(deactivate, 1500);
        }, { passive: true });

        on(hero, "mousemove", (e) => {
          const r = hero.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(logo, { duration: 0.2, rotateX: -y * 10, rotateY: x * 10, transformPerspective: 800, transformOrigin: "50% 50%" });
        });
        on(hero, "mouseleave", () => {
          gsap.to(logo, { duration: 0.35, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.4))" });
        });
      } else {
        on(hero, "mousemove", (e) => {
          const r = hero.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          logo.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(0)`;
        });
        on(hero, "mouseleave", () => { logo.style.transform = "rotateX(0) rotateY(0)"; });
      }
    }

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

  // =================================
  //  9. GSAP EXTRAS
  // =================================
  (function gsapCandy() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap) return;
    const gsap = window.gsap;
    const logo = document.querySelector('.logo-barber');
    if (logo) {
      gsap.from(logo, {
        duration: 1.8,
        delay: 0.12,
        opacity: 0,
        y: 10,
        scale: 0.92,
        rotation: -2,
        ease: 'cubic-bezier(0.2, 0.65, 0.25, 1)',
      });
    }

    function split(el, mode = 'chars') {
      if (!el) return [];
      const text = el.textContent;
      const parts = mode === 'words' ? text.split(/(\s+)/) : Array.from(text);
      el.textContent = "";
      const nodes = [];
      parts.forEach((p) => {
        const span = document.createElement('span');
        span.textContent = p;
        span.className = (mode === 'words' ? 'word' : 'char') + (p.trim() === '' ? ' spacer' : '');
        el.appendChild(span);
        nodes.push(span);
      });
      return nodes;
    }

    const h1 = document.querySelector('.titulo-principal');
    if (h1) {
      const chars = split(h1, 'chars');
      gsap.from(chars, {
        yPercent: 120,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: { each: 0.02, from: 'start' }
      });
    }

    const sl = document.querySelector('.slogan');
    if (sl) {
      gsap.from(sl, {
        y: 20,
        rotateZ: -2,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.3
      });
    }

    const grid = document.querySelector('#servicios .svc-grid');
    if (grid) {
      const cards = Array.from(grid.children);
      gsap.set(cards, { y: 16, opacity: 0 });
      const onEnter = () => {
        gsap.to(cards, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.07 });
        window.removeEventListener('scroll', onEnter);
      };
      const check = () => {
        const r = grid.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.85) onEnter();
      };
      const onEnterOnce = () => { check(); };
      window.addEventListener('scroll', onEnterOnce, { passive: true });
      window.addEventListener('load', onEnterOnce);
      setTimeout(onEnterOnce, 250);
    }

    const magnets = document.querySelectorAll('.whatsapp-float, .social-float, .whatsapp-btn.grande, .call-btn.grande');
    magnets.forEach((btn) => {
      let qx = gsap.quickTo(btn, 'x', { duration: 0.25, ease: 'power3' });
      let qy = gsap.quickTo(btn, 'y', { duration: 0.25, ease: 'power3' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        qx(dx * 8);
        qy(dy * 8);
      });
      btn.addEventListener('mouseleave', () => { qx(0); qy(0); });
      btn.addEventListener('touchstart', () => { qx(0); qy(0); }, { passive: true });
    });

    document.querySelectorAll('.review-card .star.filled').forEach((star, i) => {
      gsap.to(star, {
        opacity: 0.75,
        duration: 1.2 + Math.random(),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 1.5
      });
    });
  })();

  // =================================
  // 10. GSAP TURBO
  // =================================
  (function gsapTurbo() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap || reduce) return;
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (ST) gsap.registerPlugin(ST);

    const header = document.querySelector('header#top');
    if (header && ST) {
      gsap.to(header, {
        '--gy': '120px',
        scrollTrigger: { trigger: header, start: 'top top', end: 'bottom top', scrub: true }
      });
      const logo = header.querySelector('.logo-barber');
      if (logo) {
        gsap.to(logo, {
          y: -12,
          scale: 1.03,
          scrollTrigger: { trigger: header, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    // --- Efecto aparición "de la nada" para las secciones completas ---
    document.querySelectorAll('.section-card').forEach((section) => {
      gsap.fromTo(section, 
        { 
          opacity: 0, 
          y: 80,               // Empieza 80px más abajo
          scale: 0.85,         // Un poco más encogida
          filter: "blur(12px)" // Desenfoque inicial (efecto aparecer de la nada)
        }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          filter: "blur(0px)",
          duration: 1, 
          ease: "back.out(1.4)", // Efecto rebote (overshoot) al colocarse
          scrollTrigger: { 
            trigger: section, 
            start: "top 85%", // La animación salta cuando asoma un poco por abajo
            toggleActions: "play none none reverse" // ¡Magia! Si subes, desaparecen. Si bajas, vuelven a aparecer.
          } 
        }
      );
    });

    document.querySelectorAll('.gallery-carousel .g-slide img').forEach((img, i) => {
      gsap.fromTo(img, { scale: 1, xPercent: -2 }, {
        scale: 1.1, xPercent: 2,
        duration: 12 + (i % 3) * 2,
        ease: 'sine.inOut',
        yoyo: true, repeat: -1
      });
    });

    document.querySelectorAll('.whatsapp-float, .social-float').forEach((el, i) => {
      if (!el || !window.gsap) return;
      gsap.to(el, { y: -6, duration: 2 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  })();

  const PRELOADER_MIN_SHOW = 900;
  const __preloaderStart = performance.now();

  function hidePreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;
    const elapsed = performance.now() - __preloaderStart;
    const wait = Math.max(0, PRELOADER_MIN_SHOW - elapsed);

    const doHide = () => {
      preloader.classList.add("hide");

      const remove = () => {
        preloader.remove();
        window.dispatchEvent(new Event('app:ready'));
      };
      preloader.addEventListener("transitionend", remove, { once: true });
      setTimeout(remove, 700);

      document.documentElement.classList.remove("is-loading");
    };

    setTimeout(doHide, wait);
  }
  if (document.readyState === "complete") {
    hidePreloader();
  } else {
    window.addEventListener("load", hidePreloader);
  }

})();

(function heroTitleAnim() {
  function startHeroTitle() {
    const gsap = window.gsap;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!gsap || reduce) return;

    const h1 = document.querySelector('.titulo-principal');
    if (!h1) return;

    let chars = Array.from(h1.querySelectorAll('.char'));
    if (!chars.length) {
      const text = h1.textContent;
      h1.textContent = '';
      chars = Array.from(text).map(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        h1.appendChild(span);
        return span;
      });
      h1.style.display = 'inline-block';
    }

    gsap.set(chars, { display: 'inline-block' });
    gsap.from(chars, {
      yPercent: 120,
      opacity: 0,
      duration: 0.72,
      ease: 'power3.out',
      stagger: { each: 0.02, from: 'start' }
    });
  }

  const run = () => startHeroTitle();

  const readyNow = () => {
    const pre = document.getElementById('preloader');
    if (!pre || pre.classList.contains('hide')) run();
    else window.addEventListener('app:ready', run, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', readyNow, { once: true });
  } else {
    readyNow();
  }
})();