// backend/src/utils/stripe.js
import Stripe from "stripe";


// Defines the Stripe client
// Exports it for the rest of your backend
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// call from any where in the backend
// const stripe = require("../utils/stripe.js");
