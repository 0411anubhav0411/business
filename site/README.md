# Shilpkala Studio — e-commerce site

A statues & fountains storefront with Firebase login tracking and Razorpay
payments. Plain HTML/CSS/JS on the front end — no build step required — plus
one small Cloud Functions backend that Razorpay needs for security.

**Rename the business first**: search the files for "Shilpkala Studio" and
swap in your real name (index.html, admin.html title/brand, README).

## What's in here

```
index.html          storefront (home, shop, cart, sign-in)
admin.html           add products, see who's logged in, see paid orders
css/style.css
js/firebase-config.js   ← put your Firebase + Razorpay keys here
js/auth.js              sign-up / sign-in / Google sign-in, logs each login
js/products.js          loads products from Firestore, product modal
js/cart.js              cart drawer (localStorage)
js/checkout.js          talks to the Cloud Functions to pay via Razorpay
js/main.js              nav + page init
firestore.rules
functions/index.js       Cloud Functions: create order + verify payment
functions/package.json
```

## Why a backend function is needed for payments

Razorpay has two keys: a public `key_id` (safe in the browser) and a secret
`key_secret` (must never be visible to users). Creating an order and checking
that a payment really succeeded both require the secret key, so that has to
run on a server — here, a Firebase Cloud Function — not in your website's
JavaScript. Skipping this and doing it all client-side would let anyone open
dev tools and "pay" ₹1 for a ₹50,000 statue.

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Once created, click the **web icon (`</>`)** to register a web app → copy
   the `firebaseConfig` object it shows you into `js/firebase-config.js`
   (replace the placeholder values).
3. **Build → Authentication → Get started.** Enable **Email/Password** and
   **Google** as sign-in providers.
4. **Build → Firestore Database → Create database** (start in production
   mode — the rules file below locks it down properly).
5. Upgrade the project to the **Blaze (pay-as-you-go) plan** — Cloud
   Functions require it. Blaze still has a large free tier; a small store's
   traffic won't cost anything meaningful.

## 2. Set your admin email(s)

In `js/firebase-config.js`, set `ADMIN_EMAILS` to the Google account(s) that
should be able to open `admin.html` and add products.

## 3. Set up Razorpay

1. Sign up at [razorpay.com](https://razorpay.com) and complete KYC (needed
   before you can go live; test mode works immediately without it).
2. **Settings → API Keys → Generate Test Key** to start. Copy the `Key Id`
   into `RAZORPAY_KEY_ID` in `js/firebase-config.js`.
3. Keep the **Key Secret** — you'll give it only to the Cloud Function, next.

## 4. Install the Firebase CLI and deploy Functions

```bash
npm install -g firebase-tools
firebase login
cd path/to/this/folder
firebase init
```
When `firebase init` asks, select **Firestore**, **Functions**, and
**Hosting**, choose your existing project, and when it asks about
overwriting files, say **no** — this folder already has them.

Give the function your Razorpay secret (never commit this to git):
```bash
firebase functions:config:set razorpay.key_id="rzp_test_xxxxxxxx" razorpay.key_secret="your_secret_here"
cd functions && npm install && cd ..
firebase deploy --only functions
```
After deploying, the CLI prints your function URLs — copy the base, e.g.
`https://us-central1-your-project.cloudfunctions.net`, into
`FUNCTIONS_BASE_URL` in `js/firebase-config.js`.

## 5. Deploy Firestore rules and hosting

```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```
Firebase Hosting will give you a live URL (`your-project.web.app`). You can
attach a custom domain later from **Hosting → Add custom domain**.

## 6. Add your products

Open `your-project.web.app/admin.html`, sign in with an `ADMIN_EMAILS`
Google account, and add each statue/fountain — name, price, category,
material, an image URL, and mark it in stock. Products appear on the
storefront immediately.

For images, the simplest option while starting out is hosting photos in
**Firebase Storage** or any image host and pasting the URL — no code changes
needed.

## 7. Test a payment

Razorpay's test mode uses fake cards — while `RAZORPAY_KEY_ID` is a
`rzp_test_...` key, use card `4111 1111 1111 1111`, any future expiry, any
CVV, to simulate a successful payment. Check **admin.html → Orders** and
your Razorpay dashboard to confirm it recorded correctly.

## 8. Go live

1. In Razorpay, complete KYC, then generate **Live** API keys.
2. Swap `RAZORPAY_KEY_ID` for the live key, and re-run
   `firebase functions:config:set razorpay.key_id="rzp_live_..." razorpay.key_secret="..."`,
   then `firebase deploy --only functions`.
3. Re-deploy hosting: `firebase deploy --only hosting`.

## Seeing who logged in

Every sign-in (email or Google) writes/updates a document in the Firestore
`users` collection with name, email, and last-login time — visible in
**admin.html → Customers**, or directly in the Firebase console under
Firestore Database, or under **Authentication** for the raw account list.

## Notes on the Firestore rules

`firestore.rules` currently lets any signed-in user write to `products` —
that's fine to get started, but before you're fully live, tighten the
`products` write rule to check for an admin custom claim (Firebase docs:
"Control Access with Custom Claims") rather than "any logged-in user," so a
customer account can't edit your catalog.
