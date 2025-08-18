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
    function next() {
      show((idx + 1) % items.length);
    }
    function prev() {
      show((idx - 1 + items.length) % items.length);
    }
    function play() {
      stop();
      timer = setInterval(next, DURATION);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

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
      .svc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 14px;
        margin-bottom: 16px;
      }
      .svc-card {
        border: 2px solid #f6c90e;
        border-radius: 12px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 2px 12px rgba(26,34,56,0.06);
        background: #fff;
      }
      .svc-card h3 {
        margin: 0;
        font-size: 1.05rem;
        color: #232946;
      }
      .svc-card .price {
        font-weight: 700; color: #232946;
      }
      .svc-card button {
        align-self: flex-start;
        background: #232946; color:#fff; border: 2px solid #f6c90e;
        padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: 700;
      }
      .svc-card button.active { background: #f6c90e; color:#232946; }
      .svc-bar {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
        align-items: center;
        border-top: 3px solid #f6c90e;
        padding-top: 14px;
      }
      .svc-when label { display:block; font-weight:700; margin-bottom:6px; color:#232946;}
      .svc-dt {
        padding: 10px; border-radius: 6px; border:1.5px solid #232946; background:#f5f6fa;
      }
      .svc-total { font-size:1.1rem; }
      .svc-wa {
        background: linear-gradient(90deg, #f6c90e 0%, #232946 100%);
        color:#232946; border: 2px solid #f6c90e; border-radius: 10px; padding: 10px 14px; font-weight: 800; cursor: pointer;
      }
      @media (max-width:720px){
        .svc-bar { grid-template-columns: 1fr; }
        .svc-total { justify-self: start; }
      }
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
      const total = CATALOG
        .filter((s) => selected.has(s.id))
        .reduce((a, b) => a + b.price, 0);
      amountEl.textContent = formatEUR(total);
    }

    on(waBtn, "click", () => {
      const chosen = CATALOG.filter((s) => selected.has(s.id));
      if (!chosen.length) {
        alert("Selecciona al menos un servicio.");
        return;
      }
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

  // Validaciones suaves del formulario de contacto
  (function contactForm() {
    const form = $(".contact-form");
    if (!form) return;

    const name = $("#nombre", form);
    const phone = $("#telefono", form);
    const email = $("#email", form);
    const msg = $("#mensaje", form);

    function setError(input, text) {
      let box = input.parentElement.querySelector(".error-msg");
      if (!box) {
        box = document.createElement("div");
        box.className = "error-msg";
        box.style.color = "#b00020";
        box.style.fontSize = "0.9em";
        box.style.marginTop = "4px";
        input.parentElement.appendChild(box);
      }
      box.textContent = text || "";
      if (text) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }

    const reMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rePhone = /^[0-9\s+().-]{9,}$/;

    function validate() {
      let ok = true;
      if (!name.value.trim()) { setError(name, "Por favor, dinos tu nombre."); ok = false; }
      else setError(name, "");

      if (!rePhone.test(phone.value.trim())) { setError(phone, "Teléfono no válido."); ok = false; }
      else setError(phone, "");

      if (!reMail.test(email.value.trim())) { setError(email, "Email no válido."); ok = false; }
      else setError(email, "");

      if (!msg.value.trim()) { setError(msg, "Escribe un mensaje breve."); ok = false; }
      else setError(msg, "");
      return ok;
    }

    on(form, "submit", (e) => {
      if (!validate()) {
        e.preventDefault();
        const firstErr = form.querySelector("[aria-invalid='true']");
        firstErr?.focus();
      }
    });

    [name, phone, email, msg].forEach((el) => on(el, "input", () => setError(el, "")));
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
