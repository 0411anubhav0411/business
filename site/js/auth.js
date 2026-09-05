// Authentication state
let currentUser = null;
let authMode = "signin";

const googleProvider = new firebase.auth.GoogleAuthProvider();

// UI Modal Controls
function openAuth(mode = "signin") {
  authMode = mode;
  const overlay = document.getElementById("authOverlay");
  const errorEl = document.getElementById("authError");

  if (overlay) overlay.classList.add("open");
  if (errorEl) errorEl.style.display = "none";

  refreshAuthModalText();
}

function closeAuth() {
  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.classList.remove("open");
}

function refreshAuthModalText() {
  const isSignup = authMode === "signup";
  const titleEl = document.getElementById("authTitle");
  const subEl = document.getElementById("authSub");
  const nameField = document.getElementById("nameField");
  const submitBtn = document.getElementById("authSubmit");
  const switchContainer = document.getElementById("authSwitch");

  if (titleEl) titleEl.textContent = isSignup ? "Create an account" : "Sign in";
  if (subEl) {
    subEl.textContent = isSignup
      ? "Save your address and track your orders."
      : "Sign in to check out and track your orders.";
  }
  if (nameField) nameField.style.display = isSignup ? "block" : "none";
  if (submitBtn) submitBtn.textContent = isSignup ? "Create account" : "Sign in";

  if (switchContainer) {
    switchContainer.innerHTML = isSignup
      ? 'Already have an account? <a href="#" id="toSignup">Sign in</a>'
      : 'New here? <a href="#" id="toSignup">Create an account</a>';

    const toggleLink = document.getElementById("toSignup");
    if (toggleLink) {
      toggleLink.onclick = (e) => {
        e.preventDefault();
        authMode = isSignup ? "signin" : "signup";
        refreshAuthModalText();
      };
    }
  }
}

function showAuthError(msg) {
  const el = document.getElementById("authError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

function friendlyAuthError(err) {
  const map = {
    "auth/email-already-in-use": "That email already has an account — try signing in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/wrong-password": "Incorrect password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };
  return map[err.code] || err.message || "Something went wrong. Please try again.";
}

// User Record Persistence
async function recordLogin(user) {
  if (!user || typeof db === "undefined") return;

  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  const base = {
    name: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  await ref.set(base, { merge: true });
}

function signOutUser() {
  auth.signOut();
}

// Redirect Navigation Logic
function routeUserAfterLogin(user) {
  const adminList = typeof ADMIN_EMAILS !== "undefined" ? ADMIN_EMAILS : [];
  if (user && user.email && adminList.includes(user.email)) {
    window.location.href = "admin.html";
  } else {
    window.location.href = "profile.html";
  }
}

// Check redirect login results (mobile & desktop redirect flows)
auth.getRedirectResult()
  .then(async (result) => {
    if (result && result.user) {
      sessionStorage.removeItem("googleRedirect");
      await recordLogin(result.user);
      routeUserAfterLogin(result.user);
    }
  })
  .catch((err) => {
    if (err.code && err.code !== "auth/no-auth-event") {
      showAuthError(friendlyAuthError(err));
    }
  });

// Keep UI in sync with auth state
auth.onAuthStateChanged((user) => {
  currentUser = user;
  const btn = document.getElementById("authBtn");
  if (!btn) return;

  if (user) {
    const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
    btn.innerHTML = `<span class="user-chip"><span class="avatar">${initial}</span></span>`;
    btn.title = user.displayName || user.email;
  } else {
    btn.innerHTML = "👤";
    btn.title = "Sign in";
  }
});

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const authSubmitBtn = document.getElementById("authSubmit");
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener("click", async () => {
      const emailInput = document.getElementById("authEmail");
      const passwordInput = document.getElementById("authPassword");
      const nameInput = document.getElementById("authName");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      const name = nameInput ? nameInput.value.trim() : "";

      const errorEl = document.getElementById("authError");
      if (errorEl) errorEl.style.display = "none";

      if (!email || !password) {
        return showAuthError("Enter your email and password.");
      }

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
  }

  const googleBtn = document.getElementById("googleBtn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        sessionStorage.setItem("googleRedirect", "pending");
        await auth.signInWithRedirect(googleProvider);
      } catch (err) {
        showAuthError(friendlyAuthError(err));
      }
    });
  }

  const closeAuthBtn = document.getElementById("closeAuth");
  if (closeAuthBtn) {
    closeAuthBtn.addEventListener("click", closeAuth);
  }

  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target.id === "authOverlay") closeAuth();
    });
  }
});
