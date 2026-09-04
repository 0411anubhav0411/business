// ============================================================
// MAIN — nav scroll state, mobile menu, page init
// ============================================================

window.addEventListener("scroll", () => {
  document.getElementById("nav").classList.toggle("solid", window.scrollY > 40);
});

document.getElementById("burgerBtn").addEventListener("click", () => {
  const links = document.querySelector(".navlinks");
  const isOpen = links.style.display === "flex";
  links.style.display = isOpen ? "none" : "flex";
  links.style.cssText = isOpen
    ? "display:none"
    : "display:flex;position:fixed;top:64px;left:0;right:0;background:var(--ink);flex-direction:column;padding:20px 28px;gap:16px;z-index:99";
});

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCartCount();
});
