/* Restaurant POS + Menu CRUD + Monthly Report (localStorage) */

const STORAGE_KEYS = {
  MENU: "sr_menu_v1",
  CART: "sr_cart_v1",
  ORDERS: "sr_orders_v1",
  SETTINGS: "sr_settings_v1",
};

/** @typedef {{id:string,name:string,price:number,category?:string,imageUrl?:string}} MenuItem */
/** @typedef {{id:string,qty:number}} CartLine */
/** @typedef {{orderId:string,createdAt:string,items:Array<{id:string,name:string,qty:number,price:number}>,subtotal:number,taxPct:number,total:number}} Order */

const DEFAULT_MENU = [
  {
    id: "idly",
    name: "Idly",
    price: 20,
    category: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc500f?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "puttu",
    name: "Puttu",
    price: 35,
    category: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1604908177325-1a08d3c6d1d5?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "poori",
    name: "Poori",
    price: 40,
    category: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1604908812108-e13a3b44b2b6?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "coffee",
    name: "Coffee",
    price: 15,
    category: "Beverage",
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "dosai",
    name: "Dosai",
    price: 50,
    category: "Breakfast",
    imageUrl:
      "https://images.unsplash.com/photo-1633504581786-3160d78c5aab?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "vadai",
    name: "Vadai",
    price: 10,
    category: "Snack",
    imageUrl:
      "https://images.unsplash.com/photo-1604908177040-c8c9c984e63c?auto=format&fit=crop&w=400&q=60",
  },
  {
    id: "pazhampori",
    name: "Pazhampori",
    price: 20,
    category: "Snack",
    imageUrl:
      "https://images.unsplash.com/photo-1604908177082-67efbe0c8e13?auto=format&fit=crop&w=400&q=60",
  },
];

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function money(n) {
  const v = Number.isFinite(n) ? n : 0;
  return `₹${v.toFixed(2)}`;
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function loadMenu() {
  const raw = localStorage.getItem(STORAGE_KEYS.MENU);
  const items = raw ? safeJsonParse(raw, []) : [];
  if (!Array.isArray(items) || items.length === 0) {
    saveMenu(DEFAULT_MENU);
    return structuredClone(DEFAULT_MENU);
  }
  return items;
}

function saveMenu(menu) {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
}

function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEYS.CART);
  const lines = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(lines) ? lines : [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

function loadOrders() {
  const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
  const orders = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const s = raw ? safeJsonParse(raw, {}) : {};
  return s && typeof s === "object" ? s : {};
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateOrderId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const t = String(d.getTime()).slice(-6);
  return `SR-${y}${m}${day}-${t}`;
}

function getMonthKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function todayMonthValue() {
  return getMonthKey(new Date().toISOString());
}

// --------- State ----------
let menu = loadMenu();
let cart = loadCart();
let orders = loadOrders();
let settings = loadSettings();

// --------- Routing ----------
const views = {
  pos: $("view-pos"),
  "manage-menu": $("view-manage-menu"),
  reports: $("view-reports"),
};

function setRoute(route) {
  for (const key of Object.keys(views)) {
    views[key].classList.toggle("hidden", key !== route);
    const link = document.querySelector(`.nav-link[data-route="${key}"]`);
    if (link) link.classList.toggle("active", key === route);
  }
}

function handleHashRoute() {
  const hash = location.hash || "#/pos";
  const route = hash.replace("#/", "");
  if (route in views) setRoute(route);
  else setRoute("pos");
}

window.addEventListener("hashchange", handleHashRoute);

// --------- Menu rendering (POS) ----------
const menuList = $("menuList");
const menuSearch = $("menuSearch");

function renderMenuList() {
  const q = menuSearch.value.trim().toLowerCase();
  const filtered = menu
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((it) => {
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        (it.category || "").toLowerCase().includes(q)
      );
    });

  menuList.innerHTML = filtered
    .map((it) => {
      const img = it.imageUrl || "";
      const cat = it.category ? it.category : "Menu item";
      return `
        <div class="menu-card" role="button" tabindex="0" data-add-id="${it.id}">
          <img class="menu-img" src="${escapeHtmlAttr(img)}" alt="${escapeHtmlAttr(it.name)}" loading="lazy" />
          <div class="menu-meta">
            <div class="menu-name">${escapeHtml(it.name)}</div>
            <div class="menu-sub">${escapeHtml(cat)}</div>
            <div class="menu-price">${money(it.price)}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(s) {
  // also strips newlines
  return escapeHtml(s).replace(/[\r\n]+/g, " ");
}

function findMenuItem(id) {
  return menu.find((m) => m.id === id) || null;
}

// --------- Cart / Billing ----------
const cartEmpty = $("cartEmpty");
const cartTableWrap = $("cartTableWrap");
const cartTbody = $("cartTbody");
const cartCountPill = $("cartCountPill");
const subtotalText = $("subtotalText");
const taxPctInput = $("taxPct");
const totalText = $("totalText");
const clearCartBtn = $("clearCartBtn");
const printBillBtn = $("printBillBtn");
const payNowBtn = $("payNowBtn");

function cartCount() {
  return cart.reduce((sum, l) => sum + l.qty, 0);
}

function computeTotals() {
  let subtotal = 0;
  const rows = cart
    .map((line) => {
      const item = findMenuItem(line.id);
      if (!item) return null;
      const amount = item.price * line.qty;
      subtotal += amount;
      return { item, qty: line.qty, amount };
    })
    .filter(Boolean);

  const taxPct = clamp(Number(taxPctInput.value || 0), 0, 28);
  taxPctInput.value = String(taxPct);
  const tax = subtotal * (taxPct / 100);
  const total = subtotal + tax;
  return { rows, subtotal, taxPct, total };
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function addToCart(id) {
  const item = findMenuItem(id);
  if (!item) return;
  const idx = cart.findIndex((l) => l.id === id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  renderCart();
}

function changeQty(id, delta) {
  const idx = cart.findIndex((l) => l.id === id);
  if (idx < 0) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

function removeLine(id) {
  cart = cart.filter((l) => l.id !== id);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const count = cartCount();
  cartCountPill.textContent = `${count} item${count === 1 ? "" : "s"}`;

  const { rows, subtotal, total } = computeTotals();
  subtotalText.textContent = money(subtotal);
  totalText.textContent = money(total);

  cartEmpty.classList.toggle("hidden", rows.length > 0);
  cartTableWrap.classList.toggle("hidden", rows.length === 0);

  cartTbody.innerHTML = rows
    .map(({ item, qty, amount }) => {
      return `
        <tr>
          <td>
            <div><strong>${escapeHtml(item.name)}</strong></div>
            <div class="muted small">${escapeHtml(item.category || "")}</div>
          </td>
          <td class="right">
            <div class="qty no-print">
              <button type="button" data-qty-id="${item.id}" data-delta="-1">−</button>
              <div class="q">${qty}</div>
              <button type="button" data-qty-id="${item.id}" data-delta="1">+</button>
            </div>
            <div class="print-only">${qty}</div>
          </td>
          <td class="right">${money(item.price)}</td>
          <td class="right"><strong>${money(amount)}</strong></td>
          <td class="right no-print">
            <button class="btn small ghost" type="button" data-remove-id="${item.id}">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Pay panel amount refresh
  refreshPayPanel();
}

// POS events
menuList.addEventListener("click", (e) => {
  const el = e.target.closest("[data-add-id]");
  if (!el) return;
  addToCart(el.getAttribute("data-add-id"));
});
menuList.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest("[data-add-id]");
  if (!el) return;
  e.preventDefault();
  addToCart(el.getAttribute("data-add-id"));
});
menuSearch.addEventListener("input", renderMenuList);

cartTbody.addEventListener("click", (e) => {
  const qtyBtn = e.target.closest("[data-qty-id]");
  if (qtyBtn) {
    const id = qtyBtn.getAttribute("data-qty-id");
    const delta = Number(qtyBtn.getAttribute("data-delta"));
    changeQty(id, delta);
    return;
  }
  const rm = e.target.closest("[data-remove-id]");
  if (rm) {
    removeLine(rm.getAttribute("data-remove-id"));
  }
});

taxPctInput.addEventListener("input", () => {
  renderCart();
});

clearCartBtn.addEventListener("click", () => {
  if (cart.length === 0) return;
  if (!confirm("Clear the cart?")) return;
  clearCart();
});
printBillBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }
  window.print();
});

// --------- Pay Now (QR) ----------
const payPanel = $("payPanel");
const closePayPanelBtn = $("closePayPanelBtn");
const upiInput = $("upiInput");
const qrImg = $("qrImg");
const upiLinkText = $("upiLinkText");
const copyUpiLinkBtn = $("copyUpiLinkBtn");
const payAmountText = $("payAmountText");
const completeOrderBtn = $("completeOrderBtn");

function buildUpiLink(upiId, amount) {
  const pa = encodeURIComponent(String(upiId || "").trim());
  const pn = encodeURIComponent("Sindhu Restaurant");
  const am = encodeURIComponent(amount.toFixed(2));
  // Basic UPI deep link
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;
}

function setPayPanelOpen(open) {
  payPanel.classList.toggle("hidden", !open);
}

function refreshPayPanel() {
  const { total } = computeTotals();
  payAmountText.textContent = money(total);

  const upiId = (upiInput.value || "").trim();
  const upiLink = upiId ? buildUpiLink(upiId, total) : "";
  upiLinkText.value = upiLink || "Enter UPI ID to generate link.";

  // QR from public API (simple + no dependencies)
  const qrData = upiLink || `Pay ₹${total.toFixed(2)} to Sindhu Restaurant`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrData
  )}`;
  qrImg.src = qrUrl;
}

payNowBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }
  setPayPanelOpen(true);
  refreshPayPanel();
});
closePayPanelBtn.addEventListener("click", () => setPayPanelOpen(false));
upiInput.addEventListener("input", () => {
  settings.upiId = upiInput.value;
  saveSettings(settings);
  refreshPayPanel();
});
copyUpiLinkBtn.addEventListener("click", async () => {
  const text = upiLinkText.value;
  try {
    await navigator.clipboard.writeText(text);
    copyUpiLinkBtn.textContent = "Copied";
    setTimeout(() => (copyUpiLinkBtn.textContent = "Copy"), 900);
  } catch {
    alert("Copy failed. You can select and copy manually.");
  }
});

completeOrderBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }
  const totals = computeTotals();
  const rows = totals.rows;
  const order = /** @type {Order} */ ({
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    items: rows.map(({ item, qty }) => ({
      id: item.id,
      name: item.name,
      qty,
      price: item.price,
    })),
    subtotal: totals.subtotal,
    taxPct: totals.taxPct,
    total: totals.total,
  });
  orders.unshift(order);
  saveOrders(orders);

  // reset cart
  clearCart();
  setPayPanelOpen(false);
  alert(`Order saved: ${order.orderId}`);

  // refresh report if user is on it
  renderReport();
});

// --------- Manage Menu (CRUD) ----------
const menuForm = $("menuForm");
const menuId = $("menuId");
const menuName = $("menuName");
const menuPrice = $("menuPrice");
const menuCategory = $("menuCategory");
const menuImage = $("menuImage");
const resetMenuFormBtn = $("resetMenuFormBtn");
const resetToDefaultMenuBtn = $("resetToDefaultMenuBtn");
const adminMenuList = $("adminMenuList");
const adminSearch = $("adminSearch");

function resetMenuForm() {
  menuId.value = "";
  menuName.value = "";
  menuPrice.value = "";
  menuCategory.value = "";
  menuImage.value = "";
  menuName.focus();
}

function renderAdminMenu() {
  const q = adminSearch.value.trim().toLowerCase();
  const filtered = menu
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((it) => {
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q) ||
        (it.category || "").toLowerCase().includes(q)
      );
    });

  adminMenuList.innerHTML = filtered
    .map((it) => {
      return `
        <div class="admin-item">
          <img class="menu-img" src="${escapeHtmlAttr(
            it.imageUrl || ""
          )}" alt="${escapeHtmlAttr(it.name)}" loading="lazy" />
          <div class="meta">
            <div class="title">${escapeHtml(it.name)} <span class="muted small">(${escapeHtml(
        it.id
      )})</span></div>
            <div class="sub">${escapeHtml(it.category || "—")} • ${money(
        it.price
      )}</div>
          </div>
          <div class="admin-actions">
            <button class="btn small" type="button" data-edit-id="${escapeHtmlAttr(
              it.id
            )}">Edit</button>
            <button class="btn small danger" type="button" data-del-id="${escapeHtmlAttr(
              it.id
            )}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

menuForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = menuName.value.trim();
  const price = Number(menuPrice.value);
  if (!name) return;
  if (!Number.isFinite(price) || price < 0) {
    alert("Enter a valid price.");
    return;
  }

  const category = menuCategory.value.trim();
  const imageUrl = menuImage.value.trim();

  let id = menuId.value.trim();
  if (!id) {
    id = slugify(name);
    if (!id) id = `item-${Date.now()}`;
    // ensure unique
    let base = id;
    let i = 2;
    while (menu.some((m) => m.id === id)) {
      id = `${base}-${i++}`;
    }
  }

  const existingIdx = menu.findIndex((m) => m.id === id);
  const item = /** @type {MenuItem} */ ({
    id,
    name,
    price,
    category: category || undefined,
    imageUrl: imageUrl || undefined,
  });

  if (existingIdx >= 0) menu[existingIdx] = item;
  else menu.push(item);

  saveMenu(menu);
  renderMenuList();
  renderAdminMenu();
  resetMenuForm();
});

resetMenuFormBtn.addEventListener("click", resetMenuForm);
adminSearch.addEventListener("input", renderAdminMenu);

adminMenuList.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit-id]");
  if (editBtn) {
    const id = editBtn.getAttribute("data-edit-id");
    const item = findMenuItem(id);
    if (!item) return;
    menuId.value = item.id;
    menuName.value = item.name;
    menuPrice.value = String(item.price);
    menuCategory.value = item.category || "";
    menuImage.value = item.imageUrl || "";
    menuName.focus();
    return;
  }
  const delBtn = e.target.closest("[data-del-id]");
  if (delBtn) {
    const id = delBtn.getAttribute("data-del-id");
    const item = findMenuItem(id);
    if (!item) return;
    if (!confirm(`Delete "${item.name}"?`)) return;

    // Remove from menu and cart lines
    menu = menu.filter((m) => m.id !== id);
    cart = cart.filter((l) => l.id !== id);
    saveMenu(menu);
    saveCart(cart);

    renderMenuList();
    renderCart();
    renderAdminMenu();
  }
});

resetToDefaultMenuBtn.addEventListener("click", () => {
  if (!confirm("Reset menu to default items? This will overwrite current menu.")) return;
  menu = structuredClone(DEFAULT_MENU);
  saveMenu(menu);
  renderMenuList();
  renderAdminMenu();
  resetMenuForm();
});

// --------- Reports ----------
const reportMonth = $("reportMonth");
const reportOrders = $("reportOrders");
const reportItems = $("reportItems");
const reportRevenue = $("reportRevenue");
const ordersTbody = $("ordersTbody");
const exportCsvBtn = $("exportCsvBtn");
const clearOrdersBtn = $("clearOrdersBtn");

function renderReport() {
  const month = reportMonth.value || todayMonthValue();
  reportMonth.value = month;

  const filtered = orders.filter((o) => getMonthKey(o.createdAt) === month);
  const orderCount = filtered.length;
  const itemsSold = filtered.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0),
    0
  );
  const revenue = filtered.reduce((sum, o) => sum + o.total, 0);

  reportOrders.textContent = String(orderCount);
  reportItems.textContent = String(itemsSold);
  reportRevenue.textContent = money(revenue);

  ordersTbody.innerHTML = filtered
    .map((o) => {
      const d = new Date(o.createdAt);
      const dt = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const items = o.items.reduce((s, it) => s + it.qty, 0);
      return `
        <tr>
          <td>${escapeHtml(dt)}</td>
          <td><strong>${escapeHtml(o.orderId)}</strong></td>
          <td class="right">${items}</td>
          <td class="right"><strong>${money(o.total)}</strong></td>
        </tr>
      `;
    })
    .join("");
}

reportMonth.addEventListener("change", renderReport);

exportCsvBtn.addEventListener("click", () => {
  const month = reportMonth.value || todayMonthValue();
  const filtered = orders.filter((o) => getMonthKey(o.createdAt) === month);
  if (filtered.length === 0) {
    alert("No orders for this month.");
    return;
  }
  const rows = [
    ["orderId", "createdAt", "items", "subtotal", "taxPct", "total"].join(","),
    ...filtered.map((o) => {
      const items = o.items.map((it) => `${it.name} x${it.qty}`).join(" | ");
      return [
        csv(o.orderId),
        csv(o.createdAt),
        csv(items),
        o.subtotal.toFixed(2),
        String(o.taxPct),
        o.total.toFixed(2),
      ].join(",");
    }),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sales-${month}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

function csv(s) {
  const v = String(s ?? "");
  if (/[,"\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

clearOrdersBtn.addEventListener("click", () => {
  if (orders.length === 0) return;
  if (!confirm("Clear ALL orders? This will erase report history.")) return;
  orders = [];
  saveOrders(orders);
  renderReport();
});

// --------- Init ----------
function init() {
  handleHashRoute();

  // restore settings
  if (typeof settings.upiId === "string") upiInput.value = settings.upiId;

  // report default month
  reportMonth.value = todayMonthValue();

  renderMenuList();
  renderCart();
  renderAdminMenu();
  renderReport();
}

init();

