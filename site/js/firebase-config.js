// ============================================================
// FIREBASE CONFIG — replace with YOUR project's values.
// Get these from: Firebase Console → Project Settings → General
// → "Your apps" → Web app → SDK setup and configuration
// ============================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Cloud Function base URL — after you deploy functions (see README),
// Firebase prints this. It looks like:
// https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
const FUNCTIONS_BASE_URL = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net";

// Razorpay PUBLIC key only (starts with rzp_). NEVER put your key_secret
// anywhere in this folder — it belongs only in functions/index.js on the server.
const RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXX";

// Email address(es) allowed to use admin.html to add/edit products.
const ADMIN_EMAILS = ["you@example.com"];

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
