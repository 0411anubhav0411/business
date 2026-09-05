const firebaseConfig = {
  apiKey: "AIzaSyBVAn-y0Ro1IThj9MobLnUdrQ26f5TJTi8",
  authDomain: "akar-creations-1e5fb.firebaseapp.com",
  projectId: "akar-creations-1e5fb",
  storageBucket: "akar-creations-1e5fb.firebasestorage.app",
  messagingSenderId: "899969749265",
  appId: "1:899969749265:web:fe079f35828d84f290bcb0",
  measurementId: "G-1LJDG22V0S"
};

const FUNCTIONS_BASE_URL = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net";
const RAZORPAY_KEY_ID = "rzp_test_TY7rQmNpeCfrPQ";
const ADMIN_EMAILS = ["pathakanubhav74@gmail.com"];

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Persistence set to LOCAL");
  })
  .catch((err) => {
    console.error("Auth persistence error:", err);
  });
