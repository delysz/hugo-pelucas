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
  const $ = (sel, root = document) => {
    if (!sel || typeof sel !== 'string') return null;
    // Evita pasar URLs o HTML a querySelector
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

  // Tilt util compartido (disponible para todos los módulos)
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
      if (idx === i) return; // No hacer nada si es el mismo slide

      const currentItem = items[idx];
      const nextItem = items[i];

      // Ocultar el texto del slide actual
      if (currentItem) {
        const currentText = currentItem.querySelector('.review-text');
        gsap.to(currentText, { opacity: 0, y: 10, duration: 0.3 });
      }

      // Preparar el siguiente slide
      items.forEach(el => el.classList.remove('active'));
      nextItem.classList.add('active');

      const nextText = nextItem.querySelector('.review-text');
      const nextAuthor = nextItem.querySelector('.review-author');

      // Animar la entrada del nuevo texto y autor
      gsap.fromTo(nextText,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 }
      );
      gsap.fromTo(nextAuthor,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.5 }
      );

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
      { id: "corte_normal", price: 13, category: 'haircuts' },
      { id: "corte_fade", price: 15, category: 'haircuts' },
      { id: "corte_nino_jubilado", price: 13, category: 'haircuts' },
      // Corte + barba
      { id: "combo_normal", price: 18, category: 'combos' },
      { id: "combo_fade", price: 20, category: 'combos' },
      // Servicios de barba
      { id: "barba_arreglo", price: 8, category: 'beard' },
      { id: "barba_afeitado", price: 12, category: 'beard' },
      // Tratamientos
      { id: "trat_decoloracion", price: 28, category: 'treatments' },
      { id: "trat_mechas", price: 20, category: 'treatments' },
      { id: "trat_peeling", price: 9, category: 'treatments' },
      // Extras
      { id: "extra_cejas", price: 4, category: 'extras' },
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

      // Agrupa los servicios por categoría para poder mostrarlos ordenados
      const servicesByCategory = CATALOG_DATA.reduce((acc, service) => {
        const category = service.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(service);
        return acc;
      }, {});

      // Limpia el contenido anterior
      grid.innerHTML = "";

      const categoryOrder = ['haircuts', 'combos', 'beard', 'treatments', 'extras'];

      // Dibuja cada categoría y sus servicios en orden
      categoryOrder.forEach(categoryId => {
        if (!servicesByCategory[categoryId]) return;

        // Quitar TODOS los emojis del título de la categoría
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'svc-category-title';
        let catLabel = dict.svc_categories[categoryId] || categoryId;
        catLabel = catLabel.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        categoryTitle.textContent = catLabel;
        grid.appendChild(categoryTitle);

        // Dibuja las tarjetas de servicio para esta categoría
        servicesByCategory[categoryId].forEach((svc) => {
          // Quitar TODOS los emojis del nombre del servicio
          let name = dict.svc_catalog[svc.id] || svc.id;
          name = name.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
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
          attachTiltEffect(card);
        });
      });

      // Actualiza los textos de la barra inferior y el total
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

    // Validación de fecha y habilitación del botón de WhatsApp
    if (dtInput) {
      dtInput.addEventListener('input', function () {
        if (!this.value) return;
        const dt = new Date(this.value);
        const day = dt.getDay(); // 0=Domingo, 6=Sábado

        // Sábado o domingo: cerrado
        if (day === 0 || day === 6) {
          alert('No se pueden reservar citas los sábados ni domingos.');
          this.value = '';
          return;
        }
      });
    }

    // Deshabilita el botón de WhatsApp si no hay fecha seleccionada
    if (waBtn && dtInput) {
      const toggleBtn = () => {
        waBtn.disabled = !dtInput.value;
      };
      dtInput.addEventListener('input', toggleBtn);
      toggleBtn();
    }

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

    // Tilt del logo en hero + GSAP hover avanzado
    const hero = $("header");
    const logo = $(".logo-barber");
    if (hero && logo) {
      // Fallback destello CSS
      on(logo, "mouseenter", () => logo.classList.add("hover-shine"));
      on(logo, "animationend", (e) => { if (e.animationName === "logoShine") logo.classList.remove("hover-shine"); });

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hasGSAP = typeof window.gsap !== 'undefined' && !reduce;

      if (hasGSAP) {
        const tlHover = gsap.timeline({ paused: true });
        tlHover.to(logo, { duration: 0.35, scale: 1.04, filter: "drop-shadow(0 16px 36px rgba(246,201,14,0.55))" }, 0)
          .to(logo, { duration: 0.35, rotateZ: -2 }, 0)
          .to(document.documentElement, { duration: 0.35, "--ring-opacity": 0.95, "--ring-scale": 1, ease: "power2.out" }, 0);

        // Rotación continua del anillo mientras hover
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

        // Soporte táctil: tap activa animación 1.5s
        on(logo, "touchstart", () => {
          activate();
          setTimeout(deactivate, 1500);
        }, { passive: true });

        // Tilt 3D suave con GSAP
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
        // Fallback sin GSAP (CSS transforms directos)
        on(hero, "mousemove", (e) => {
          const r = hero.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          logo.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(0)`;
        });
        on(hero, "mouseleave", () => { logo.style.transform = "rotateX(0) rotateY(0)"; });
      }
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


  // =================================
  //  9. GSAP EXTRAS — detalles finos
  // =================================
  (function gsapCandy() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // if (reduce) return;  // ← comenta o elimina esta línea SOLO si quieres forzar el hero
    if (!window.gsap) return;
    const gsap = window.gsap;
    // Hero: Animación de entrada para el logo
    const logo = document.querySelector('.logo-barber');
    if (logo) {
      // Replicamos la animación 'logoIntro' con GSAP
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
    // --- Split text utility (no plugin needed) ---
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

    // Hero: letras que aparecen desde abajo + ligero overshoot
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

    // Slogan: animación sencilla para mostrar sin dividir en palabras
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

    // Stagger en Servicios (si existe grid)
    const grid = document.querySelector('#servicios .svc-grid');
    if (grid) {
      const cards = Array.from(grid.children);
      gsap.set(cards, { y: 16, opacity: 0 });
      const onEnter = () => {
        gsap.to(cards, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.07 });
        window.removeEventListener('scroll', onEnter);
      };
      // simple viewport check without extra plugins
      const check = () => {
        const r = grid.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.85) onEnter();
      };
      const onEnterOnce = () => { check(); };
      window.addEventListener('scroll', onEnterOnce, { passive: true });
      window.addEventListener('load', onEnterOnce);
      setTimeout(onEnterOnce, 250);
    }

    // Botones magnéticos (float + CTAs)
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

    // Estrellas del review: respiración sutil
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
  // 10. GSAP TURBO — parallax, pin, tilt
  // =================================
  (function gsapTurbo() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.gsap || reduce) return;
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (ST) gsap.registerPlugin(ST);

    // Header parallax glow + logo float
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

    // Section headings: soft reveal on scroll (no pin to avoid layout shifts)
    document.querySelectorAll('.section-card > h2').forEach((h2) => {
      gsap.from(h2, {
        y: 24, opacity: 0,
        duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: h2, start: 'top 80%' }
      });
    });

    // Ken Burns en la Galería (loop suave, no intrusivo)
    document.querySelectorAll('.gallery-carousel .g-slide img').forEach((img, i) => {
      gsap.fromTo(img, { scale: 1, xPercent: -2 }, {
        scale: 1.1, xPercent: 2,
        duration: 12 + (i % 3) * 2,
        ease: 'sine.inOut',
        yoyo: true, repeat: -1
      });
    });

    // ===============================================
    //  FUNCIÓN PARA EFECTO TILT 3D EN TARJETAS
    // ===============================================

    function applyTilt3D(selector, options = {}) {
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;
      const defaults = { maxRotate: 8, perspective: 800, scale: 1.04, ease: 'power3.out', duration: 0.3 };
      const opts = { ...defaults, ...options };
      elements.forEach((el) => {
        let qx = gsap.quickTo(el, 'rotateX', { duration: opts.duration, ease: opts.ease });
        let qy = gsap.quickTo(el, 'rotateY', { duration: opts.duration, ease: opts.ease });
        let qs = gsap.quickTo(el, 'scale', { duration: opts.duration, ease: opts.ease });

        el.style.transformStyle = 'preserve-3d';
        el.style.transformPerspective = `${opts.perspective}px`;

        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          qx(-y * opts.maxRotate);
          qy(x * opts.maxRotate);
          qs(opts.scale);
        });
        el.addEventListener('mouseleave', () => {
          qx(0);
          qy(0);
          qs(1);
        });
        el.addEventListener('touchstart', () => {
          qx(0);
          qy(0);
          qs(1);
        }, { passive: true });
      });
    }

    // Flotantes con vaivén sutil (versión segura)
    document.querySelectorAll('.whatsapp-float, .social-float').forEach((el, i) => {
      if (!el || !window.gsap) return;
      gsap.to(el, { y: -6, duration: 2 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // Parallax simple por data-speed (opcional si hay elementos con data-speed)
    document.querySelectorAll('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
      if (!ST) return;
      gsap.to(el, {
        yPercent: -speed * 100,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  })();

  // Tiempo mínimo visible del preloader (en ms)
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
        // ⬇️ AVISA AL RESTO DE QUE YA PODEMOS ANIMAR LA PÁGINA
        window.dispatchEvent(new Event('app:ready'));
      };
      preloader.addEventListener("transitionend", remove, { once: true });
      setTimeout(remove, 700);

      document.documentElement.classList.remove("is-loading");
    };

    setTimeout(doHide, wait);
  }
  if (document.readyState === "complete") {
    setTimeout(hidePreloader, 3000); // 3 segundos
  } else {
    window.addEventListener("load", () => setTimeout(hidePreloader, 3000));
  }

})();


// Animación del H1 (Barbería Hugo) sincronizada con preloader
(function heroTitleAnim() {
  function startHeroTitle() {
    const gsap = window.gsap;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!gsap || reduce) return;

    const h1 = document.querySelector('.titulo-principal');
    if (!h1) return;

    // Split a caracteres (evita duplicarlo si ya se hizo)
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

  // Arrancamos en el momento adecuado:
  const run = () => startHeroTitle();

  // Si el preloader ya no está o nunca existió, corre tras DOM listo.
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

