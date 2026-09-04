// ============================================================
// CART — kept in localStorage (cart contents aren't sensitive,
// so this avoids needing sign-in just to browse and add items).
// Sign-in is required only at checkout, in checkout.js.
// ============================================================

let cart = JSON.parse(localStorage.getItem("akaar_cart") || "{}"); // { productId: qty }

function saveCart() {
  localStorage.setItem("akaar_cart", JSON.stringify(cart));
  renderCartCount();
}

function addToCart(productId, qty = 1) {
  cart[productId] = (cart[productId] || 0) + qty;
  saveCart();
  closeProduct();
  showToast("Added to cart");
  renderDrawer();
}

function updateCartQty(productId, delta) {
  if (!cart[productId]) return;
  cart[productId] += delta;
  if (cart[productId] <= 0) delete cart[productId];
  saveCart();
  renderDrawer();
}

function removeFromCart(productId) {
  delete cart[productId];
  saveCart();
  renderDrawer();
}

function cartLines() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: allProducts.find((p) => p.id === id), qty }))
    .filter((l) => l.product);
}

function cartTotal() {
  return cartLines().reduce((sum, l) => sum + l.product.price * l.qty, 0);
}

function renderCartCount() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const el = document.getElementById("cartCount");
  el.textContent = count;
  el.style.display = count > 0 ? "flex" : "none";
}

function renderDrawer() {
  const lines = cartLines();
  const container = document.getElementById("drawerItems");
  if (lines.length === 0) {
    container.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Browse the collection to add a piece.</div>`;
  } else {
    container.innerHTML = lines.map((l) => `
      <div class="cart-item">
        <img src="${l.product.image || placeholderImg}" onerror="this.src=placeholderImg">
        <div class="cart-item-body">
          <div class="name">${escapeHtml(l.product.name)}</div>
          <div class="price">₹${fmt(l.product.price)} × ${l.qty}</div>
          <div class="cart-item-actions">
            <div class="qty-box">
              <button onclick="updateCartQty('${l.product.id}', -1)">−</button>
              <span>${l.qty}</span>
              <button onclick="updateCartQty('${l.product.id}', 1)">+</button>
            </div>
            <a href="#" class="remove-link" onclick="event.preventDefault();removeFromCart('${l.product.id}')">Remove</a>
          </div>
        </div>
      </div>
    `).join("");
  }
  document.getElementById("cartTotal").textContent = "₹" + fmt(cartTotal());
}

function openCart() {
  renderDrawer();
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("open");
}
function closeCartDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCartDrawer);
document.getElementById("drawerOverlay").addEventListener("click", closeCartDrawer);
