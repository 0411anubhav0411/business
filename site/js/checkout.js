// ============================================================
// CHECKOUT — talks to the Cloud Functions in /functions, which are
// the only place your Razorpay key_secret ever lives. This file
// never touches the secret key, only the public RAZORPAY_KEY_ID.
//
// Flow: create order on the server → open Razorpay widget →
// server verifies the signature → order is saved to Firestore.
// ============================================================

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  if (cartLines().length === 0) {
    showToast("Your cart is empty");
    return;
  }
  if (!currentUser) {
    closeCartDrawer();
    showToast("Please sign in to check out");
    openAuth("signin");
    return;
  }
  await startCheckout();
});

async function startCheckout() {
  const lines = cartLines();
  const amount = cartTotal(); // in ₹

  const btn = document.getElementById("checkoutBtn");
  const originalText = btn.textContent;
  btn.textContent = "Preparing checkout…";
  btn.disabled = true;

  try {
    // 1. Ask our server (Cloud Function) to create a Razorpay order.
    // Never create the order client-side — that would let anyone pass
    // any amount they want.
    const orderRes = await fetch(`${FUNCTIONS_BASE_URL}/createRazorpayOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: currentUser.uid,
        items: lines.map((l) => ({ id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty })),
      }),
    });
    if (!orderRes.ok) throw new Error("order-failed");
    const order = await orderRes.json(); // { id, amount, currency }

    // 2. Open Razorpay's hosted checkout widget with that order id.
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Shilpkala Studio",
      description: `${lines.length} item(s)`,
      order_id: order.id,
      prefill: {
        name: currentUser.displayName || "",
        email: currentUser.email || "",
      },
      theme: { color: "#ab7f47" },
      handler: async function (response) {
        await verifyAndSaveOrder(response, lines, amount);
      },
      modal: {
        ondismiss: function () {
          btn.textContent = originalText;
          btn.disabled = false;
        },
      },
    };
    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      showToast("Payment failed: " + (resp.error && resp.error.description ? resp.error.description : "please try again"));
      btn.textContent = originalText;
      btn.disabled = false;
    });
    rzp.open();
  } catch (err) {
    console.error(err);
    showToast("Couldn't start checkout. Please try again.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function verifyAndSaveOrder(response, lines, amount) {
  showToast("Verifying payment…");
  try {
    const verifyRes = await fetch(`${FUNCTIONS_BASE_URL}/verifyRazorpayPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        uid: currentUser.uid,
        customerEmail: currentUser.email,
        customerName: currentUser.displayName || "",
        items: lines.map((l) => ({ id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty })),
        amount,
      }),
    });
    const result = await verifyRes.json();
    if (result.success) {
      cart = {};
      saveCart();
      closeCartDrawer();
      showToast("Payment successful — thank you for your order!");
    } else {
      showToast("Payment could not be verified. Contact us with your payment ID: " + response.razorpay_payment_id);
    }
  } catch (err) {
    console.error(err);
    showToast("Payment made, but we couldn't confirm it automatically. Contact us with payment ID: " + response.razorpay_payment_id);
  }
}
