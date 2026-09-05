// ============================================================
// FIREBASE CONFIG — replace with YOUR project's values.
// Get these from: Firebase Console → Project Settings → General
// → "Your apps" → Web app → SDK setup and configuration
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBVAn-y0Ro1IThj9MobLnUdrQ26f5TJTi8",
  authDomain: "akar-creations-1e5fb.web.app",
  authDomain: "akar-creations-1e5fb.firebase.com"
  projectId: "akar-creations-1e5fb",
  storageBucket: "akar-creations-1e5fb.firebasestorage.app",
  messagingSenderId: "899969749265",
  appId: "1:899969749265:web:fe079f35828d84f290bcb0",
  measurementId: "G-1LJDG22V0S"
};

// Cloud Function base URL — after you deploy functions (see README),
// Firebase prints this. It looks like:
// https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
const FUNCTIONS_BASE_URL = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net";

// Razorpay PUBLIC key only (starts with rzp_). NEVER put your key_secret
// anywhere in this folder — it belongs only in functions/index.js on the server.
const RAZORPAY_KEY_ID = "rzp_test_TY7rQmNpeCfrPQ";

// Email address(es) allowed to use admin.html to add/edit products.
const ADMIN_EMAILS = ["pathakanubhav74@gmail.com"];

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Persistence set to LOCAL");
  });
