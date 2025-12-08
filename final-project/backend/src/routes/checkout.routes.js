// contains ONLY server-side logic.
import { Router } from "express";
import { stripe } from "../utils/stripe.js";

const router = Router();

// ---------- STRIPE API ENPOINTS --------------------
// SEND publishable key to frontend
router.get("/config", (req, res) => {
  res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session" , async (req, res) =>  {
  try {
    console.log("➡️ /create-checkout-session hit");
    console.log("📥 Body received:", req.body);
    // req.body = donation info sent from your frontend
    const { priceID, amountCents} = req.body || {};

    let lineItem;

    if(priceID) {
      lineItem = { price: priceID, quantity: 1};
    } else if (amountCents) {
      lineItem = {
        price_data: {
          product_data: { name: "custom donation" }, 
          currency: "USD",
          unit_amount: amountCents,
        },
        quantity: 1,
      };
    } else {
        return res.status(400).json({ error: "Must provide priceId or amount" });
    }

    // calls stripes API to create a checkout session object on stripes servers
    // strip automatically links a paymetn inetnt
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      ui_mode: "custom",
      billing_address_collection: 'auto',
      line_items: [lineItem],
      mode: "payment",
      return_url: `http://localhost:3000/complete?session_id={CHECKOUT_SESSION_ID}`,
    });
    
    // sends res back to frontend 
    res.json({ clientSecret: session.client_secret });
    console.log("✅ Created session:", session.id);

  } catch (err) {
    console.error("❌ Error creating sesion: ",  err);
    res.status(500).json({ error: err.message });
  }
});

// CONFIRMS PAYMENT STATUS, SESSION STATUS 
// since my broweser can talk to stripes secret API directly , server must do it and report bakc a safe summary
// the browser needs to knwo if the donation succeeeded, right now only stripe knows. and only server wuth the secret key can securley cas stripe for the real ressult
router.get("/session-status", async (req, res) => {
  // stripe.checkout.sessions.retrieve(...) server calls stripes APU using secret key(already configured in stripe client) to fetch the checkout session object for that session id
  const session = await stripe.checkout.sessions.retrieve(
    // req.query.session_id reads the session_id query param from the URL 
    // req query param is set in complete.js
    req.query.session_id,
    // expand: ["payment_intent"]sesion.paymetn_intetn woudljust be an ID string
    // exand tells stripe "inline the fill Payment INtent objecgt right in teh response"
    {expand: ["payment_intent"]}
  );
  
  console.log("➡️ /session-status hit with session_id:", req.query.session_id);

  res.json({
    // status of the checkoutsession
    status: session.status,
    // paymentStatus Only present when session.type=complete
    // session.type=complete -> (Checkout Session is complete. Payment processing may still be in progres)
    payment_status: session.payment_status, // shoudlnt this be diffrent
    // payment_status: session.paymentStatus,
    payment_intent_id: session.payment_intent.id,
    payment_intent_status: session.payment_intent.status // STATUS OF THE PAYMENT INTETN
  });
});


export default router;