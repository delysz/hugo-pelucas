(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const fmt = new Intl.NumberFormat("es-ES", { style:"currency", currency:"EUR" });
  const money = (n) => fmt.format(n);

  // Demo catalog — replace with your real products later
  const CATALOG = [
    { id:"pomada-mate", name:"Pomada Mate Fijación Media", price:12.5, img:"https://images.unsplash.com/photo-1604900257830-1a6a9b826d09?q=80&w=800&auto=format&fit=crop", desc:"Textura natural, sin brillo." },
    { id:"aceite-barba", name:"Aceite para Barba Citrus", price:15.0, img:"https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=800&auto=format&fit=crop", desc:"Hidratación y aroma fresco." },
    { id:"aftershave", name:"After Shave Bálsamo", price:9.9, img:"https://images.unsplash.com/photo-1582092728066-5a6a6a6e7a7b?q=80&w=800&auto=format&fit=crop", desc:"Calma y protege la piel." },
    { id:"shampoo", name:"Champú Caballero 300ml", price:8.5, img:"https://images.unsplash.com/photo-1603933222839-37f2347340b9?q=80&w=800&auto=format&fit=crop", desc:"Limpieza diaria suave." },
    { id:"peine-madera", name:"Peine de Madera", price:6.0, img:"https://images.unsplash.com/photo-1556228907-94e5c0d6b97e?q=80&w=800&auto=format&fit=crop", desc:"Antiestático, acabado natural." },
    { id:"cera-fuerte", name:"Cera Fijación Fuerte", price:13.2, img:"https://images.unsplash.com/photo-1592802842365-4ec5cbb3f2c2?q=80&w=800&auto=format&fit=crop", desc:"Control total todo el día." },
    { id:"brocha-afeitar", name:"Brocha de Afeitar Sintética", price:11.0, img:"https://images.unsplash.com/photo-1626869051697-447ddb5a0bc1?q=80&w=800&auto=format&fit=crop", desc:"Suave y duradera." },
    { id:"toalla", name:"Toalla Facial Caliente", price:5.5, img:"https://images.unsplash.com/photo-1582582621959-e8284d4a4c7a?q=80&w=800&auto=format&fit=crop", desc:"Para ritual de afeitado." }
  ];

  const STORAGE_KEY = "hugo_shop_cart_v1";

  const state = {
    items: loadCart(),
    pickup: false,
  };

  function loadCart(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch{ return []; }
  }
  function saveCart(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    updateBadge();
  }

  function addItem(id, delta=1){
    const prod = CATALOG.find(p => p.id===id);
    if(!prod) return;
    const item = state.items.find(i => i.id===id);
    if(item) item.qty = Math.min(99, item.qty + delta);
    else state.items.push({ id, qty: Math.max(1, delta) });
    saveCart(); renderCart();
  }
  function setQty(id, qty){
    const item = state.items.find(i => i.id===id);
    if(!item) return;
    item.qty = Math.max(1, Math.min(99, qty|0));
    saveCart(); renderCart();
  }
  function removeItem(id){
    state.items = state.items.filter(i => i.id!==id);
    saveCart(); renderCart();
  }
  function subtotal(){
    return state.items.reduce((sum, it) => {
      const p = CATALOG.find(x => x.id===it.id);
      return sum + (p ? p.price * it.qty : 0);
    }, 0);
  }

  // UI: Product grid
  const grid = $("#productGrid");
  const inputSearch = $("#search");
  const selectSort = $("#sort");

  function renderProducts(){
    const q = (inputSearch.value || "").trim().toLowerCase();
    let list = CATALOG.filter(p => !q || (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
    const sort = selectSort.value;
    if(sort==="price-asc") list.sort((a,b)=>a.price-b.price);
    if(sort==="price-desc") list.sort((a,b)=>b.price-a.price);
    if(sort==="name-asc") list.sort((a,b)=>a.name.localeCompare(b.name));
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
            <button type="button" class="add-btn" data-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> Añadir</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  on(inputSearch, "input", renderProducts);
  on(selectSort, "change", renderProducts);

  // Qty controls on grid (event delegation)
  on(grid, "click", (e) => {
    const btn = e.target.closest("button");
    if(!btn) return;
    const id = btn.getAttribute("data-id");
    if(btn.classList.contains("add-btn")){
      const qtyInput = btn.parentElement.querySelector(".qty-input");
      const qty = Math.max(1, Math.min(99, parseInt(qtyInput.value || "1", 10)));
      addItem(id, qty);
      openCart();
      return;
    }
    const act = btn.getAttribute("data-act");
    if(act==="inc" || act==="dec"){
      const input = btn.parentElement.querySelector(".qty-input");
      const cur = parseInt(input.value || "1", 10);
      input.value = Math.max(1, Math.min(99, cur + (act==="inc" ? 1 : -1)));
    }
  });

  // ===== Cart drawer =====
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

  function updateBadge(){
    const count = state.items.reduce((a,b)=>a+b.qty,0);
    badgeEl.textContent = count;
  }

  function renderCart(){
    itemsEl.innerHTML = "";
    if(state.items.length===0){
      itemsEl.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`;
    } else {
      state.items.forEach(it => {
        const p = CATALOG.find(x => x.id===it.id);
        if(!p) return;
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
    const envio = state.pickup ? 0 : 0; // define shipping later
    subtotalEl.textContent = money(sub);
    totalEl.textContent = money(sub + envio);
  }

  function openCart(){
    drawer.setAttribute("aria-hidden","false");
    drawer.querySelector(".cart-panel").focus?.();
  }
  function closeCart(){
    drawer.setAttribute("aria-hidden","true");
  }

  on(openBtn, "click", openCart);
  on(closeBtn, "click", closeCart);
  on(backdrop, "click", closeCart);
  on(drawer, "keydown", (e) => { if(e.key==="Escape") closeCart(); });

  on(itemsEl, "click", (e) => {
    const btn = e.target.closest("button");
    if(!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    if(btn.classList.contains("remove")) { removeItem(id); return; }
    if(act==="inc") {
      addItem(id, +1);
      return;
    }
    if(act==="dec"){
      const it = state.items.find(x=>x.id===id);
      if(!it) return;
      if(it.qty<=1) removeItem(id);
      else { it.qty--; saveCart(); renderCart(); }
    }
  });
  on(itemsEl, "input", (e) => {
    const input = e.target.closest("input.ci");
    if(!input) return;
    const id = input.getAttribute("data-id");
    const qty = parseInt(input.value || "1", 10);
    setQty(id, qty);
  });

  on(pickupChk, "change", () => {
    state.pickup = pickupChk.checked;
    renderCart();
  });

  // Checkout via WhatsApp
  on(checkoutWA, "click", () => {
    if(state.items.length===0) { alert("Tu carrito está vacío."); return; }
    const waNumber = "34657790911"; // <- cambia al número de la barbería
    const lines = [
      "Hola 👋, quiero hacer un pedido:",
      ...state.items.map(it => {
        const p = CATALOG.find(x => x.id===it.id);
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

  // Initial render
  renderProducts();
  updateBadge();
  renderCart();

})();