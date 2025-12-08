import express from "express";
import { Router } from "express";
import { db } from "../db/db.js";
import { stripe } from "../utils/stripe.js";
import { 
    sendConfirmationEmail,
    sendPaymentFailedEmail,
    sendRefundEmail,
    sendDisputeAlertEmail,
    sendAbandonedCheckoutEmail
} from "../utils/email.js";

// router is a mini express app
// "routers" handels a subset of routes
const router = Router();

// ---------------- STRIPE WEBHOOK ENDPOINT----------------------------------
// express.raw({ type: "application/json" }) is middleware just for this route.
// express.raw(...) tells Express: do not parse the body into JSON yet.
// instead keep req.body as the raw body so that stripes signatiure check dosent fail 
router.post(
    "/",
    express.raw({ type: "application/json" }),
    async(req, res) =>{
        // in stripes req is header called "stripe-signature"
        const signature = req.headers["stripe-signature"];
        
        // Need signatre to verify the event was really signed by Stripe
        let event; // will hold the verified event

        // -------------- 1. VERIFY WEEBHOOK IS FROM STRIPE/ VERIFY WEBHOOK SIGNATRE -------
        try{
            // stripe's helper .constructEvent() checks if:
            // signature matches what stripe expects
            // thows an error if payload(req.body) was modified
            // throws an erro if signatire is missing/wrnog
            event = stripe.webhooks.constructEvent(
                // STRIPE GIVES MY SERVER A PAYLOAD AND A SIGNATIRE
                req.body, // RAW JSON OBJECT , CONTAINS EVNET.OBJECT
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("❌ Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        // after TRY BLOCK, event is now a trusted, parsed Stripe event object.
        // STRIPE REQ.BODY:
        // "type": "checkout.session.completed",
        // "data": { "object": { ... checkout session ... } } 
        console.log("📩 Webhook Event Received:", event.type)
        
        // GET OBJECT FROM EVENT
        const dataObject = event.data.object;

        // -------------- 2. HANDELS EACH EVENT TYPE --------------
        try {
            // -------------- SUCCESSFUL CHECKOUT SESSION --------------
            if (event.type === "checkout.session.completed") {
                console.log("📩 Webhook event:", event.type);
                console.log("🧾 Webhook data object keys:", Object.keys(event.data.object));

                // const dataObject = event.data.object
                // event.data.object is the actual thing the event is about
                // for event.type == checkout.session.completed, the event is about Checkout Session object
                const session = dataObject;
                console.log("✅ Payment completed for:", session.customer_details.email);
                // checkout session object has porperites 
                const name = session.customer_details?.name;
                const email = session.customer_details?.email;
                const amount = session.amount_total / 100;
                
                // SEND RECIPT / THANKYOU EMAIL 
                console.log("🔔 Sending receipt email to:", email);
                try {
                    await sendConfirmationEmail({ name, email, amount });
                    console.log("✅ Email sent");
                } catch (err) {
                    console.error("❌ Error sending email:", err);
                }
                // INSERT DOnTION INTO DB
                // .none bc not expexting any returned rows 
                await db.none(
                    `INSERT INTO donations (session_id, email, name, amount, status)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT(session_id) DO NOTHING`,
                    [session.id, email, name, amount, "completed"]
                );

                console.log("💾 Saved donation to DB:", session.id);
            }

            // -------------- PAYMENT FAILED AFTER LEAVING CHECOUT -------
            else if (event.type === "payment_intent.payment_failed") {
                console.log("📩 Webhook event:", event.type);
                console.log("🧾 Webhook data object keys:", Object.keys(event.data.object));

                // Stripe PaymnetIntent object:
                // "object": {
                //     "id": "pi_123",
                //     "status": "requires_payment_method",
                //     "last_payment_error": { ... },
                //     "charges": { ... },
                //     ...
                // }
                const paymentIntent = dataObject;

                // 3 possible locations of the donors email, depending on why the paymetn failed
                const email =
                    // possible location 1: email is in donatin form some where: elements( expressHcekoutelemnt, payment element)
                    paymentIntent.last_payment_error?.payment_method?.billing_details?.email ||
                    // possible location 2: Stripe attaches Charge object to PaymentIntent
                    paymentIntent.charges?.data?.[0]?.billing_details?.email ||
                    paymentIntent.receipt_email;

                const reason =
                    paymentIntent.last_payment_error?.message || "No Stripe last payment error message was found so, Your payment could not be completed.";

                const retryUrl =
                    (process.env.BASE_URL || "http://localhost:3000") + "/donate";

                console.log("❌ Payment failed for:", email);

                if (email) {
                    await sendPaymentFailedEmail({ email, reason, retryUrl });
                }

                // TODO: DB → record failure
            }
            // -------------- REFUND CREATED OR UPDATED --------------
            else if (
                event.type === "charge.refunded" ||
                event.type === "charge.refund.updated"
            ) {
                console.log("📩 Webhook event:", event.type);
                console.log("🧾 Webhook data object keys:", Object.keys(event.data.object));

                const charge = dataObject;

                const email = charge.billing_details?.email;
                const amount = charge.amount_refunded / 100;

                console.log("💸 Refund for:", email);

                if (email) {
                await sendRefundEmail({ email, amount });
                }

                // TODO: DB → update donation refund status
            }
            // -------------- DISPUTE ----------------------------
            else if (event.type === "charge.dispute.created") {
                console.log("📩 Webhook event:", event.type);
                console.log("🧾 Webhook data object keys:", Object.keys(event.data.object));

                const dispute = dataObject;

                const chargeId = dispute.charge;
                const amount = dispute.amount / 100;

                console.log("⚠️ Chargeback on:", chargeId);

                // email admin
                await sendDisputeAlertEmail({ chargeId, amount });

                // TODO: DB → log dispute
            }
            // -------------- ABANDOND CHECKOUT --------------
            else if (event.type === "checkout.session.expired") {
                console.log("📩 Webhook event:", event.type);
                console.log("🧾 Webhook data object keys:", Object.keys(event.data.object));

                const session = dataObject;

                const email = session.customer_details?.email;

                console.log("🚫 Checkout expired:", session.id);

                const resumeUrl =
                (process.env.BASE_URL || "http://localhost:3000") + "/donate";

                if (email) {
                await sendAbandonedCheckoutEmail({ email, resumeUrl });
                }

                // TODO: DB → log abandoned session
            }
            // -------------- DEFAULT/UNHANDELED EVENTS ---------------------
            else {
                console.log("ℹ️ Unhandled event:", event.type);
            }

            // sends stipe a HTTPS 200 so stripe know s the weebhook was succesully porcessed
            res.status(200).send("Webhook Received & proccssed"); 

        } catch (err) {
            console.error("❌ Webhook handling error:", err);
            // Still return 200 so Stripe does not retry infinitely
            res.status(200).send("Webhook handler error");
        }
    }
); 

export default router;

