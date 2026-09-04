// ============================================================
// CLOUD FUNCTIONS — the only place your Razorpay key_secret lives.
// Deploy with: firebase deploy --only functions
// Set your secret first (see README):
//   firebase functions:config:set razorpay.key_id="rzp_test_xxx" razorpay.key_secret="xxx"
// ============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

function getRazorpay() {
  const cfg = functions.config().razorpay || {};
  const key_id = cfg.key_id || process.env.RAZORPAY_KEY_ID;
  const key_secret = cfg.key_secret || process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured. See README.md setup steps.");
  }
  return { instance: new Razorpay({ key_id, key_secret }), key_secret };
}

// POST /createRazorpayOrder  { uid, items: [{id,name,price,qty}] }
// Recomputes the total from Firestore product prices — never trusts a
// client-supplied amount — then asks Razorpay to open an order for it.
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const { uid, items } = req.body;
      if (!uid || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing uid or items" });
      }

      // Recompute the true total server-side from Firestore, ignoring any
      // price the client sent, so nobody can pay less by editing requests.
      let amount = 0;
      for (const item of items) {
        const snap = await db.collection("products").doc(item.id).get();
        if (!snap.exists) return res.status(400).json({ error: `Unknown product ${item.id}` });
        amount += snap.data().price * item.qty;
      }

      const { instance } = getRazorpay();
      const order = await instance.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `rcpt_${uid}_${Date.now()}`,
        notes: { uid },
      });

      res.json({ id: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not create order" });
    }
  });
});

// POST /verifyRazorpayPayment
// { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, customerEmail, customerName, items, amount }
// Verifies Razorpay's HMAC signature — this is the step that actually
// confirms the payment is real, not the browser callback alone.
exports.verifyRazorpayPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        uid, customerEmail, customerName, items, amount,
      } = req.body;

      const { key_secret } = getRazorpay();
      const expected = crypto
        .createHmac("sha256", key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const valid = expected === razorpay_signature;

      await db.collection("orders").doc(razorpay_payment_id).set({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        uid: uid || null,
        customerEmail: customerEmail || null,
        customerName: customerName || null,
        items: items || [],
        amount: amount || 0,
        status: valid ? "paid" : "verification_failed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: valid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  });
});
