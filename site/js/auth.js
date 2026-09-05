// or the Firebase console (Authentication tab + "users" collection).
// ============================================================

// List of admin email addresses eligible for admin dashboard access
if (typeof ADMIN_EMAILS === "undefined"){
const ADMIN_EMAILS = ["pathakanubhav74@gmail.com"];}

let currentUser = null;
let authMode = "signin"; // or "signup"

const googleProvider = new firebase.auth.GoogleAuthProvider();

function openAuth(mode = "signin") {
authMode = mode;
  const overlay = document.getElementById("authOverlay");
  const errorEl = document.getElementById("authError");
  if (overlay) overlay.classList.add("open");
  if (errorEl) errorEl.style.display = "none";
  document.getElementById("authOverlay").classList.add("open");
  document.getElementById("authError").style.display = "none";
refreshAuthModalText();
}

function closeAuth() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.classList.remove("open");
  document.getElementById("authOverlay").classList.remove("open");
}

function refreshAuthModalText() {
const isSignup = authMode === "signup";
  
  const title = document.getElementById("authTitle");
  const sub = document.getElementById("authSub");
  const nameField = document.getElementById("nameField");
  const submitBtn = document.getElementById("authSubmit");
  const switchEl = document.getElementById("authSwitch");

  if (title) title.textContent = isSignup ? "Create an account" : "Sign in";
  if (sub) sub.textContent = isSignup
  document.getElementById("authTitle").textContent = isSignup ? "Create an account" : "Sign in";
  document.getElementById("authSub").textContent = isSignup
? "Save your address and track your orders."
: "Sign in to check out and track your orders.";
  if (nameField) nameField.style.display = isSignup ? "block" : "none";
  if (submitBtn) submitBtn.textContent = isSignup ? "Create account" : "Sign in";
  if (switchEl) {
    switchEl.innerHTML = isSignup
      ? 'Already have an account? <a href="#" id="toSignup">Sign in</a>'
      : 'New here? <a href="#" id="toSignup">Create an account</a>';
    
    const toSignupBtn = document.getElementById("toSignup");
    if (toSignupBtn) {
      toSignupBtn.onclick = (e) => {
        e.preventDefault();
        authMode = isSignup ? "signin" : "signup";
        refreshAuthModalText();
      };
    }
  }
  document.getElementById("nameField").style.display = isSignup ? "block" : "none";
  document.getElementById("authSubmit").textContent = isSignup ? "Create account" : "Sign in";
  document.getElementById("authSwitch").innerHTML = isSignup
    ? 'Already have an account? <a href="#" id="toSignup">Sign in</a>'
    : 'New here? <a href="#" id="toSignup">Create an account</a>';
  document.getElementById("toSignup").onclick = (e) => {
    e.preventDefault();
    authMode = isSignup ? "signin" : "signup";
    refreshAuthModalText();
  };
}

function showAuthError(msg) {
const el = document.getElementById("authError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
  el.textContent = msg;
  el.style.display = "block";
}

// Writes/updates a doc in Firestore "users" collection every time someone logs in.
// This is how you "know who logged in on the site" from outside Firebase Auth's
// own dashboard — e.g. to show a customer list in admin.html.
async function recordLogin(user) {
  if (typeof db === "undefined" || !db) return;
const ref = db.collection("users").doc(user.uid);
const snap = await ref.get();
const base = {
@@ -83,6 +59,39 @@ async function recordLogin(user) {
await ref.set(base, { merge: true });
}

document.getElementById("authSubmit").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name = document.getElementById("authName").value.trim();
  document.getElementById("authError").style.display = "none";

  if (!email || !password) return showAuthError("Enter your email and password.");

  try {
    if (authMode === "signup") {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) await cred.user.updateProfile({ displayName: name });
      await recordLogin(cred.user);
    } else {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      await recordLogin(cred.user);
    }
    closeAuth();
  } catch (err) {
    showAuthError(friendlyAuthError(err));
  }
});

document.getElementById("googleBtn").addEventListener("click", async () => {
  try {
    const cred = await auth.signInWithPopup(googleProvider);
    await recordLogin(cred.user);
    closeAuth();
  } catch (err) {
    showAuthError(friendlyAuthError(err));
  }
});

function friendlyAuthError(err) {
const map = {
"auth/email-already-in-use": "That email already has an account — try signing in instead.",
@@ -96,109 +105,31 @@ function friendlyAuthError(err) {
}

function signOutUser() {
  if (typeof auth !== "undefined") auth.signOut();
  auth.signOut();
}

// Keep UI in sync with auth state
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const btn = document.getElementById("authBtn");
    if (btn) {
      if (user) {
        const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
        btn.innerHTML = `<span class="user-chip"><span class="avatar">${initial}</span></span>`;
        btn.title = user.displayName || user.email;
      } else {
        btn.innerHTML = "👤";
        btn.title = "Sign in";
      }
    }
  });
}

// DOM Event Listeners initialized after elements are fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const authSubmit = document.getElementById("authSubmit");
  const googleBtn = document.getElementById("googleBtn");
  const authBtn = document.getElementById("authBtn");
  const closeAuthBtn = document.getElementById("closeAuth");
  const authOverlay = document.getElementById("authOverlay");
  const logoutBtn = document.getElementById("logout-btn");

  if (authSubmit) {
    authSubmit.addEventListener("click", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("authEmail");
      const passwordInput = document.getElementById("authPassword");
      const nameInput = document.getElementById("authName") || document.getElementById("nameField");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      const name = nameInput ? nameInput.value.trim() : "";

      const errorEl = document.getElementById("authError");
      if (errorEl) errorEl.style.display = "none";

      if (!email || !password) return showAuthError("Enter your email and password.");

      try {
        if (authMode === "signup") {
          const cred = await auth.createUserWithEmailAndPassword(email, password);
          if (name && cred.user) await cred.user.updateProfile({ displayName: name });
          await recordLogin(cred.user);
        } else {
          const cred = await auth.signInWithEmailAndPassword(email, password);
          await recordLogin(cred.user);
        }
        closeAuth();
      } catch (err) {
        showAuthError(friendlyAuthError(err));
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const cred = await auth.signInWithPopup(googleProvider);
        await recordLogin(cred.user);
        closeAuth();
      } catch (err) {
        showAuthError(friendlyAuthError(err));
      }
    });
  }

  if (authBtn) {
    authBtn.addEventListener("click", () => {
      if (currentUser) {
        if (ADMIN_EMAILS.includes(currentUser.email)) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "profile.html";
        }
      } else {
        openAuth("signin");
      }
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener("click", closeAuth);
  }

  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target.id === "authOverlay") closeAuth();
    });
auth.onAuthStateChanged((user) => {
  currentUser = user;
  const btn = document.getElementById("authBtn");
  if (user) {
    const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
    btn.innerHTML = `<span class="user-chip"><span class="avatar">${initial}</span></span>`;
    btn.title = user.displayName || user.email;
  } else {
    btn.innerHTML = "👤";
    btn.title = "Sign in";
}
});

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        window.location.href = "index.html";
      });
    });
document.getElementById("authBtn").addEventListener("click", () => {
  if (currentUser) {
    if (confirm(`Signed in as ${currentUser.email}. Sign out?`)) signOutUser();
  } else {
    openAuth("signin");
}
});
document.getElementById("closeAuth").addEventListener("click", closeAuth);
document.getElementById("authOverlay").addEventListener("click", (e) => {
  if (e.target.id === "authOverlay") closeAuth();
});
