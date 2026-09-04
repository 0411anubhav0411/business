// ============================================================
// PRODUCTS — reads the "products" collection from Firestore.
// Add products via admin.html (or directly in the Firebase console).
// Expected fields per product doc:
//   name (string), price (number, in ₹), mrp (number, optional strike price),
//   category ("statues" | "fountains" | "garden"), material (string),
//   height (string, e.g. "24 in"), desc (string), image (string URL),
//   inStock (boolean), badge (string, optional e.g. "New")
// ============================================================

let allProducts = [];
let activeFilter = "all";

async function loadProducts() {
  const gallery = document.getElementById("gallery");
  try {
    const snap = await db.collection("products").where("inStock", "==", true).get();
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Failed to load products:", err);
    gallery.innerHTML = `<div class="empty-state">Couldn't load the collection right now. Check your Firebase config in js/firebase-config.js.</div>`;
    return;
  }
  renderGallery();
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === filter);
  });
  renderGallery();
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
}

function renderGallery() {
  const gallery = document.getElementById("gallery");
  const items = activeFilter === "all" ? allProducts : allProducts.filter((p) => p.category === activeFilter);

  if (allProducts.length === 0) {
    gallery.innerHTML = `<div class="empty-state">No pieces listed yet — add your first product from admin.html.</div>`;
    return;
  }
  if (items.length === 0) {
    gallery.innerHTML = `<div class="empty-state">Nothing in this category yet.</div>`;
    return;
  }

  gallery.innerHTML = items.map((p) => `
    <div class="card" onclick="openProduct('${p.id}')">
      <div class="card-img">
        ${p.badge ? `<span class="card-badge">${escapeHtml(p.badge)}</span>` : ""}
        <img src="${p.image || placeholderImg}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src=placeholderImg">
      </div>
      <div class="card-body">
        <div class="card-mat">${escapeHtml(p.material || "")}${p.height ? " · " + escapeHtml(p.height) : ""}</div>
        <div class="card-name">${escapeHtml(p.name)}</div>
        <div class="card-price">${p.mrp ? `<s>₹${fmt(p.mrp)}</s>` : ""}₹${fmt(p.price)}</div>
      </div>
    </div>
  `).join("");
}

function openProduct(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;
  const modal = document.getElementById("productModal");
  modal.innerHTML = `
    <button class="modal-close" onclick="closeProduct()">✕</button>
    <div class="product-view">
      <img src="${p.image || placeholderImg}" alt="${escapeHtml(p.name)}" onerror="this.src=placeholderImg">
      <div class="product-info">
        <div class="card-mat">${escapeHtml(p.material || "")}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="price">₹${fmt(p.price)}${p.mrp ? ` <s style="color:var(--stone);font-size:15px">₹${fmt(p.mrp)}</s>` : ""}</div>
        <p class="desc">${escapeHtml(p.desc || "")}</p>
        <div class="spec-row"><span>Material</span><span>${escapeHtml(p.material || "—")}</span></div>
        <div class="spec-row"><span>Height</span><span>${escapeHtml(p.height || "—")}</span></div>
        <div class="spec-row"><span>Category</span><span>${escapeHtml(p.category || "—")}</span></div>
        <div class="qty-row">
          <div class="qty-box">
            <button onclick="stepModalQty(-1)">−</button>
            <span id="modalQty">1</span>
            <button onclick="stepModalQty(1)">+</button>
          </div>
        </div>
        <button class="btn btn-solid" style="width:100%" onclick="addToCart('${p.id}', modalQtyValue())">Add to cart</button>
      </div>
    </div>
  `;
  document.getElementById("productOverlay").classList.add("open");
}
function closeProduct() {
  document.getElementById("productOverlay").classList.remove("open");
}
let _modalQty = 1;
function stepModalQty(d) {
  _modalQty = Math.max(1, _modalQty + d);
  document.getElementById("modalQty").textContent = _modalQty;
}
function modalQtyValue() {
  const v = _modalQty;
  _modalQty = 1;
  return v;
}

const placeholderImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='400' height='500' fill='%23d8d0bd'/%3E%3C/svg%3E";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (btn) setFilter(btn.dataset.filter);
});
document.getElementById("productOverlay").addEventListener("click", (e) => {
  if (e.target.id === "productOverlay") closeProduct();
});
