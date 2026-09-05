// Handle Google redirect result on page load (mobile)

let currentUser = null;
let authMode = "signin";

const googleProvider = new firebase.auth.GoogleAuthProvider();

function openAuth(mode = "signin") {
  authMode = mode;
  document.getElementById("authOverlay").classList.add("open");
  document.getElementById("authError").style.display = "none";
  refreshAuthModalText();
}

function closeAuth() {
  document.getElementById("authOverlay").classList.remove("open");
}

function refreshAuthModalText() {
  const isSignup = authMode === "signup";
  document.getElementById("authTitle").textContent = isSignup ? "Create an account" : "Sign in";
  document.getElementById("authSub").textContent = isSignup
    ? "Save your address and track your orders."
    : "Sign in to check out and track your orders.";
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
  el.textContent = msg;
  el.style.display = "block";
}

async function recordLogin(user) {
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
    // Use redirect instead of popup for mobile compatibility
    await auth.signInWithRedirect(googleProvider);
  } catch (err) {
    showAuthError(friendlyAuthError(err));
  }
});

function friendlyAuthError(err) {
  const map = {
    "auth/email-already-in-use": "That email already has an account — try signing in instead.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/wrong-password": "Incorrect password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
  };
  return map[err.code] || "Something went wrong. Please try again.";
}

function signOutUser() {
  auth.signOut();
}

// Keep UI in sync with auth state
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  const btn = document.getElementById("authBtn");

  if (user) {
    const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
    btn.innerHTML = `<span class="user-chip"><span class="avatar">${initial}</span></span>`;
    btn.title = user.displayName || user.email;

    const redirectResult = sessionStorage.getItem("googleRedirect");
    if (redirectResult === "pending") {
      sessionStorage.removeItem("googleRedirect");
      await recordLogin(user);
      if (ADMIN_EMAILS.includes(user.email)) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "profile.html";
      }
    }
  } else {
    btn.innerHTML = "👤";
    btn.title = "Sign in";
  }
});
// ← MOVE IT HERE (after all functions are defined)
// Handle Google redirect result (mobile fix)
auth.getRedirectResult().then(async (result) => {
  if (result && result.user) {
    await recordLogin(result.user);
    // Redirect based on email after successful Google login
    if (ADMIN_EMAILS.includes(result.user.email)) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "profile.html";
    }
  }
}).catch((err) => {
  document.body.insertAdjacentHTML('afterbegin',
    `<div style="position:fixed;top:0;left:0;right:0;background:red;color:white;
    padding:16px;z-index:9999;font-size:14px;word-break:break-all;">
    ERROR: ${err.code} — ${err.message}
    </div>`
  );
});

// Profile icon click — redirect to profile or admin based on email
document.getElementById("googleBtn").addEventListener("click", async () => {
  sessionStorage.setItem("googleRedirect", "pending");
  try {
    await auth.signInWithRedirect(googleProvider);
  } catch (err) {
    showAuthError(friendlyAuthError(err));
  }
});
document.getElementById("closeAuth").addEventListener("click", closeAuth);
document.getElementById("authOverlay").addEventListener("click", (e) => {
  if (e.target.id === "authOverlay") closeAuth();
});
