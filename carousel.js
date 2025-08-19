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
    const DURATION = 5000;

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
  (function galleryLightbox(){
    function init(){
      const grid = document.querySelector(".gallery-grid");
      if(!grid) return;

      // crear contenedor si no existe
      let lb = document.querySelector(".lightbox");
      if(!lb){
        lb = document.createElement("div");
        lb.className = "lightbox";
        lb.setAttribute("hidden","");
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

      function open(i){
        idx = i;
        const a = items[idx];
        const full = a.getAttribute("data-full") || a.getAttribute("href");
        const alt = a.querySelector("img")?.getAttribute("alt") || "";
        imgEl.src = full;
        imgEl.alt = alt;
        lb.hidden = false;
        document.body.style.overflow = "hidden";
      }
      function close(){
        lb.hidden = true;
        imgEl.src = "";
        document.body.style.overflow = "";
      }
      const prev = () => open((idx - 1 + items.length) % items.length);
      const next = () => open((idx + 1) % items.length);

      grid.addEventListener("click", (e) => {
        const a = e.target.closest(".gallery-item");
        if(!a) return;
        e.preventDefault();
        const i = items.indexOf(a);
        if(i >= 0) open(i);
      });
      btnClose.addEventListener("click", close);
      btnPrev.addEventListener("click", prev);
      btnNext.addEventListener("click", next);
      lb.addEventListener("click", (e) => { if(e.target === lb) close(); });

      window.addEventListener("keydown", (e) => {
        if(lb.hidden) return;
        if(e.key === "Escape") close();
        if(e.key === "ArrowLeft") prev();
        if(e.key === "ArrowRight") next();
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

  // Aviso 'síguenos' cuando el usuario llega al final (robusto)
  (function followCTA(){
    function init(){
      const footer = document.querySelector("footer");
      if (!footer) return;

      // Crear CTA si no existe
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

      const closeBtn = cta.querySelector(".cta-close");
      const hideCTA = () => {
        cta.classList.remove("show");
        sessionStorage.setItem("ctaDismissed","1");
        setTimeout(() => { cta.hidden = true; }, 200);
      };
      closeBtn.addEventListener("click", hideCTA);

      // Observer para mostrar al ver el footer
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !sessionStorage.getItem("ctaDismissed")) {
            cta.hidden = false;
            requestAnimationFrame(() => cta.classList.add("show"));
          }
        });
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

// ===== GALERÍA: carrusel autoplay + controles =====
(function galleryAutoplay(){
  const wrap = document.querySelector(".gallery-carousel");
  if(!wrap) return;
  const slides = Array.from(wrap.querySelectorAll(".g-slide"));
  if(slides.length === 0) return;

  const prevBtn = wrap.querySelector(".g-prev");
  const nextBtn = wrap.querySelector(".g-next");
  let i = 0;
  let timer = null;
  const INTERVAL = 4000; // ms

  function show(n){
    slides.forEach((s, idx) => s.classList.toggle("active", idx === n));
  }
  function next(){ i = (i + 1) % slides.length; show(i); }
  function prev(){ i = (i - 1 + slides.length) % slides.length; show(i); }

  function start(){
    stop();
    timer = setInterval(next, INTERVAL);
  }
  function stop(){
    if(timer) clearInterval(timer);
    timer = null;
  }

  // init
  show(i);
  start();

  // Controles
  if(nextBtn) nextBtn.addEventListener("click", () => { next(); start(); });
  if(prevBtn) prevBtn.addEventListener("click", () => { prev(); start(); });

  // Pausa al pasar el ratón (solo desktop)
  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);

  // Si el usuario abre el lightbox (click en <a>), no tocamos nada: se abrirá encima
})();

