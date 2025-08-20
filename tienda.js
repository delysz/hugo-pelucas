(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const money = (n) => fmt.format(n);

  // ------------------ NUEVO: helpers URL/Deep link ------------------
  const params = new URLSearchParams(location.search);
  const setParam = (k, v) => {
    const p = new URLSearchParams(location.search);
    if (v == null || v === "" || v === "recommended") p.delete(k);
    else p.set(k, v);
    const q = p.toString();
    history.replaceState(null, "", q ? `?${q}` : location.pathname);
  };

  // Reescribir nav internos si algún día aparecen como "#..."
  $$(".shop-nav a[href^='#']").forEach(a => {
    a.setAttribute("href", "index.html" + a.getAttribute("href"));
  });

  // Marcar TIENDA activa
  const tiendaLink = $(`.shop-nav a[href$='tienda.html']`);
  if (tiendaLink) {
    tiendaLink.classList.add("active");
    tiendaLink.setAttribute("aria-current", "page");
  }

  // ------------------ Catálogo (igual) ------------------
  const CATALOG = [
    { id: "cosmetics-tenerife", name: "Cosmetics Tenerife (aceite natural)", price: 14.0, img: "tienda/cosmetics-tenerife.jpg", desc: "Natural, buena absorción, sin residuos grasos" },
    { id: "uppercut-deluxe", name: "Uppercut Deluxe (aceite)", price: 19.5, img: "tienda/uppercut-deluxe.jpg", desc: "Fragancia masculina (pachulí/cuero), sin grasa" },
    { id: "beardburys-deluxe", name: "Beardburys Deluxe (navaja)", price: 29.0, img: "https://via.placeholder.com/400x400?text=Beardburys+Navaja", desc: "Herramienta premium, estética de lujo" },
    { id: "captain-fawcett", name: "Captain Fawcett Whisky (aceite)", price: 24.0, img: "https://via.placeholder.com/400x400?text=Captain+Fawcett", desc: "Fragancia intensa de whisky, branding icónico" },
    { id: "suavecito-whiskey", name: "Suavecito Whiskey (aceite)", price: 18.0, img: "https://via.placeholder.com/400x400?text=Suavecito+Whiskey", desc: "Fórmula nutritiva y botella protectora" },
    { id: "jameson-zew", name: "Jameson x Zew (aceite)", price: 22.0, img: "https://via.placeholder.com/400x400?text=Jameson+ZEW", desc: "Aroma whisky sour y cítricos, ingredientes 100 % naturales" },
    { id: "cyrulicy-burboneska", name: "Cyrulicy Burboneska (aceite)", price: 23.5, img: "https://via.placeholder.com/400x400?text=Cyrulicy+Burboneska", desc: "Aroma complejo y rico, alto nivel de ingredientes nutritivos" },
    { id: "gentlemans-tipple", name: "Gentleman’s Tipple (aceite)", price: 20.0, img: "https://via.placeholder.com/400x400?text=Gentlemans+Tipple", desc: "Fragancia británica refinada en formato compacto" },
    { id: "superior-dry-goods", name: "Superior Dry Goods (set vegano)", price: 27.0, img: "https://via.placeholder.com/400x400?text=Superior+Dry+Goods", desc: "Regalo artesanal, sensible, libre de fragancias" },
    { id: "vintage-balm-tin", name: "Vintage balm tin (bálsamo)", price: 16.0, img: "https://via.placeholder.com/400x400?text=Vintage+Balm+Tin", desc: "Vintage, atractivo visual, coleccionable" }
  ];

  const STORAGE_KEY = "hugo_shop_cart_v1";
  const state = { items: loadCart(), pickup: false };

  function loadCart() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); updateBadge(); }

  function addItem(id, delta = 1) {
    const prod = CATALOG.find(p => p.id === id);
    if (!prod) return;
    const item = state.items.find(i => i.id === id);
    if (item) item.qty = Math.min(99, item.qty + delta);
    else state.items.push({ id, qty: Math.max(1, delta) });
    saveCart(); renderCart();
  }
  function setQty(id, qty) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(99, qty | 0));
    saveCart(); renderCart();
  }
  function removeItem(id) { state.items = state.items.filter(i => i.id !== id); saveCart(); renderCart(); }
  function subtotal() {
    return state.items.reduce((sum, it) => {
      const p = CATALOG.find(x => x.id === it.id);
      return sum + (p ? p.price * it.qty : 0);
    }, 0);
  }

  // UI refs
  const grid = $("#productGrid");
  const inputSearch = $("#search");
  const selectSort = $("#sort");

  // ------- render products -------
  function renderProducts() {
    const q = (inputSearch.value || "").trim().toLowerCase();
    let list = CATALOG.filter(p => !q || (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
    const sort = selectSort.value;
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    grid.innerHTML = "";
    list.forEach(p => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <a class="thumb"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
        <div class="body">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="price">${money(p.price)}</div>
          <div class="qty">
            <button type="button" data-id="${p.id}" data-act="dec" aria-label="Reducir cantidad">−</button>
            <input type="number" min="1" max="99" value="1" data-id="${p.id}" class="qty-input" aria-label="Cantidad">
            <button type="button" data-id="${p.id}" data-act="inc" aria-label="Aumentar cantidad">+</button>
            <button type="button" class="add-btn" data-id="${p.id}">
              <i class="fa-solid fa-cart-plus"></i> Añadir
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ------- sincronizar URL cuando cambian filtros -------
  function syncQuery() {
    const q = (inputSearch.value || "").trim();
    const sort = selectSort.value || "recommended";
    setParam("q", q);
    setParam("sort", sort);
  }

  on(inputSearch, "input", () => { renderProducts(); syncQuery(); });
  on(selectSort, "change", () => { renderProducts(); syncQuery(); });

  // Qty controls (delegación)
  on(grid, "click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (btn.classList.contains("add-btn")) {
      const qtyInput = btn.parentElement.querySelector(".qty-input");
      const qty = Math.max(1, Math.min(99, parseInt(qtyInput.value || "1", 10)));
      addItem(id, qty); openCart(); return;
    }
    const act = btn.getAttribute("data-act");
    if (act === "inc" || act === "dec") {
      const input = btn.parentElement.querySelector(".qty-input");
      const cur = parseInt(input.value || "1", 10);
      input.value = Math.max(1, Math.min(99, cur + (act === "inc" ? 1 : -1)));
    }
  });

  // ------- Drawer carrito -------
  const drawer = $("#cartDrawer");
  const openBtn = $("#openCart");
  const closeBtn = $("#closeCart");
  const backdrop = $("#cartBackdrop");
  const itemsEl = $("#cartItems");
  const subtotalEl = $("#cartSubtotal");
  const totalEl = $("#cartTotal");
  const badgeEl = $("#cartCount");
  const pickupChk = $("#pickup");
  const checkoutWA = $("#checkoutWhatsApp");

  function updateBadge() { badgeEl.textContent = state.items.reduce((a, b) => a + b.qty, 0); }
  function renderCart() {
    itemsEl.innerHTML = "";
    if (state.items.length === 0) {
      itemsEl.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`;
    } else {
      state.items.forEach(it => {
        const p = CATALOG.find(x => x.id === it.id);
        if (!p) return;
        const row = document.createElement("div");
        row.className = "item";
        row.innerHTML = `
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <div>
            <h4>${p.name}</h4>
            <div class="muted">${money(p.price)} · <span>${money(p.price * it.qty)}</span></div>
            <div class="actions">
              <button data-id="${it.id}" data-act="dec">−</button>
              <input type="number" min="1" max="99" value="${it.qty}" data-id="${it.id}" class="ci">
              <button data-id="${it.id}" data-act="inc">+</button>
              <button class="remove" data-id="${it.id}" title="Quitar">🗑</button>
            </div>
          </div>
          <div style="align-self:start; font-weight:900">${money(p.price * it.qty)}</div>
        `;
        itemsEl.appendChild(row);
      });
    }
    const sub = subtotal();
    const envio = state.pickup ? 0 : 0;
    subtotalEl.textContent = money(sub);
    totalEl.textContent = money(sub + envio);
  }

  function openCart() { drawer.setAttribute("aria-hidden", "false"); drawer.querySelector(".cart-panel").focus?.(); }
  function closeCart() { drawer.setAttribute("aria-hidden", "true"); }

  on(openBtn, "click", openCart);
  on(closeBtn, "click", closeCart);
  on(backdrop, "click", closeCart);
  on(drawer, "keydown", (e) => { if (e.key === "Escape") closeCart(); });

  on(itemsEl, "click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    if (btn.classList.contains("remove")) { removeItem(id); return; }
    if (act === "inc") { addItem(id, +1); return; }
    if (act === "dec") {
      const it = state.items.find(x => x.id === id);
      if (!it) return;
      if (it.qty <= 1) removeItem(id);
      else { it.qty--; saveCart(); renderCart(); }
    }
  });
  on(itemsEl, "input", (e) => {
    const input = e.target.closest("input.ci"); if (!input) return;
    const id = input.getAttribute("data-id");
    const qty = parseInt(input.value || "1", 10);
    setQty(id, qty);
  });

  on(pickupChk, "change", () => { state.pickup = pickupChk.checked; renderCart(); });

  // ------- Checkout WhatsApp (número igual que en index) -------
  on(checkoutWA, "click", () => {
    if (state.items.length === 0) { alert("Tu carrito está vacío."); return; }
    const waNumber = "34651435444"; // unificado con la home
    const lines = [
      "Hola 👋, quiero hacer un pedido:",
      ...state.items.map(it => {
        const p = CATALOG.find(x => x.id === it.id);
        return `• ${p ? p.name : it.id} × ${it.qty}`;
      }),
      `Total: ${money(subtotal())}`,
      state.pickup ? "Modalidad: Recogida en tienda" : "Modalidad: Envío (consultar coste)",
      "",
      "¿Me confirmáis disponibilidad y tiempo de entrega? ¡Gracias!"
    ];
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
  });

  // ------- Aplicar parámetros de la URL al cargar -------
  function applyParams() {
    if (params.has("q")) {
      const q = params.get("q") || "";
      $("#search").value = q;
    }
    if (params.has("sort")) {
      const val = params.get("sort");
      if (val) $("#sort").value = val;
    }
    renderProducts();

    if (params.get("cart") === "open") openCart();

    if (params.has("add")) {
      const id = params.get("add");
      const qty = Math.max(1, Math.min(99, parseInt(params.get("qty") || "1", 10)));
      addItem(id, qty);
      openCart();
    }
  }

  // ------- Init -------
  applyParams();
  updateBadge();
  renderCart();

})();

// ===== Chat Hugo (solo tienda) =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const launcher = $("#chat-launcher");
  const box = $("#chat-box");
  const closeBtn = box?.querySelector(".chat-close");
  const stream = $("#chat-stream");
  const form = $("#chat-form");
  const input = $("#chat-input");

  // abrir/cerrar
  function open() { box?.setAttribute("aria-hidden", "false"); input?.focus(); }
  function close() { box?.setAttribute("aria-hidden", "true"); }
  on(launcher, "click", open);
  on(closeBtn, "click", close);
  on(box, "keydown", e => { if (e.key === "Escape") close(); });

  // helpers UI
  function addMsg(text, who = "hugo") {
    const wrap = document.createElement("div");
    wrap.className = "msg " + (who === "user" ? "msg-user" : "msg-hugo");
    const avatar = `<img src="logo-hugo.png" alt="Hugo" class="msg-avatar">`;
    const bubble = `<div class="msg-bubble">${text}</div>`;
    wrap.innerHTML = who === "user" ? bubble : avatar + bubble;
    stream.appendChild(wrap);
    stream.scrollTop = stream.scrollHeight;
  }
  function addQuick(buttons) {
    const last = stream.lastElementChild?.querySelector(".msg-bubble");
    if (!last) return;
    const row = document.createElement("div");
    row.className = "quick";
    row.innerHTML = buttons.map(b => `<button data-intent="${b.intent}">${b.label}</button>`).join("");
    last.appendChild(row);
  }

  // acciones conectadas con la tienda
  const WA = "34651435444";
  const TEL = "+34651435444";
  const MAPS = "https://www.google.com/maps?q=41.7171479,-0.8414919";

  function doIntent(intent, payload = "") {
    switch (intent) {
      case "horario":
        addMsg("Lunes 16:00–21:00 · Mar–Vie 9:45–14:00 / 16:00–21:00. Sáb–Dom cerrado.");
        break;
      case "como-llegar":
        window.open(MAPS, "_blank", "noopener");
        addMsg("Te abro Google Maps en una pestaña nueva.");
        break;
      case "whatsapp":
        window.open(`https://wa.me/${WA}?text=${encodeURIComponent("Hola 👋, tengo una consulta sobre la tienda.")}`, "_blank", "noopener");
        addMsg("Abriendo WhatsApp…");
        break;
      case "llamar":
        location.href = `tel:${TEL}`;
        break;
      case "abrir-carrito":
        try { window.openCart?.(); } catch { }
        document.getElementById("openCart")?.click();
        addMsg("Abriendo tu carrito…");
        break;
      case "buscar":
        // sincroniza con el input real de la tienda
        const q = (payload || "").trim();
        const search = document.getElementById("search");
        if (search) {
          search.value = q;
          search.dispatchEvent(new Event("input", { bubbles: true }));
          addMsg(q ? `Buscando “${q}”…` : "Limpiando búsqueda.");
        } else {
          addMsg("No encuentro el buscador ahora mismo 😅");
        }
        break;
      case "envio":
        addMsg("Ahora mismo ofrecemos recogida en tienda y envío local (consulta coste por WhatsApp).");
        break;
      case "pago":
        addMsg("En tienda: efectivo o tarjeta. Por pedido WhatsApp: acordamos método al confirmar.");
        break;
      default:
        addMsg("Puedo ayudarte con horario, cómo llegar, WhatsApp, abrir el carrito o buscar productos. ¿Qué necesitas?");
        addQuick([
          { intent: "horario", label: "⏰ Horario" },
          { intent: "como-llegar", label: "🗺️ Cómo llegar" },
          { intent: "abrir-carrito", label: "🛒 Abrir carrito" },
          { intent: "whatsapp", label: "💬 WhatsApp" },
          { intent: "buscar", label: "🔎 Buscar" }
        ]);
    }
  }

  // clic en sugerencias (quick buttons)
  on(stream, "click", (e) => {
    const btn = e.target.closest("[data-intent]");
    if (!btn) return;
    const intent = btn.getAttribute("data-intent");
    if (intent === "buscar") {
      // lanza una pregunta guiada
      addMsg("¿Qué te gustaría buscar? (por ejemplo: aceite, navaja…)");
    }
    doIntent(intent);
  });

  // parser muy simple de intents
  function detectIntent(text) {
    const t = text.toLowerCase();
    if (/horario|abierto|cierras?/.test(t)) return "horario";
    if (/dónde|como llegar|direcci|mapa|ubicaci/.test(t)) return "como-llegar";
    if (/whats|wasap|whatsapp|mensaje/.test(t)) return "whatsapp";
    if (/llamar|tel|telefono|teléfono/.test(t)) return "llamar";
    if (/carrito|cesta|compra|abrir carrito/.test(t)) return "abrir-carrito";
    if (/buscar|producto|aceite|navaja|bálsamo|balsamo/.test(t)) return "buscar";
    if (/env[ií]o|enviar|reparto/.test(t)) return "envio";
    if (/pago|tarjeta|efectivo|bizum|transfer/.test(t)) return "pago";
    return "desconocido";
  }

  // envío del mensaje
  on(form, "submit", (e) => {
    e.preventDefault();
    const txt = (input.value || "").trim();
    if (!txt) return;
    addMsg(txt, "user");
    input.value = "";

    const intent = detectIntent(txt);
    if (intent === "buscar") {
      // extraer posible keyword
      const kw = txt.replace(/(buscar|busca|quiero|producto|de|un|una)/gi, "").trim();
      doIntent("buscar", kw);
    } else {
      doIntent(intent);
    }
  });

  // un toque UX: oculta el bocadillo al abrir
  on(launcher, "click", () => launcher.querySelector(".chat-bubble")?.remove());
})();

