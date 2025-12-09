
const BACKEND_URL = "https://non-profit-backend-s6s9.onrender.com";

let stripe;
let checkout;
let actions;

// ----- UI elements -----
const customInput = document.getElementById("custom-amount");
const customDonationErrMsg = document.getElementById("custom-error");

const payButton = document.getElementById("submit");
const buttonText = document.querySelector("#button-text");

const emailInput = document.getElementById("email");
const emailErrors = document.getElementById("email-errors");

let selectedPriceID = null;
let customAmountCents = null;


// -------------------------------------------------------------
//  UPDATE PAY BUTTON
// -------------------------------------------------------------
function updatePayButton() {
    if (selectedPriceID) {
        const selectedBtn = document.querySelector(".donate-btn.selected");
        if (selectedBtn) {
            const selectedAmount = selectedBtn.innerText.replace("$", "");
            buttonText.textContent = `Pay $${selectedAmount} now`;
        }
    } else if (customAmountCents) {
        buttonText.textContent = `Pay $${(customAmountCents / 100).toFixed(2)} now`;
    } else {
        buttonText.textContent = "Pay now";
    }
}


// -------------------------------------------------------------
//  EMAIL VALIDATION THROUGH STRIPE ACTIONS
// -------------------------------------------------------------
async function validateEmail(email) {
    const updateResult = await actions.updateEmail(email);
    const isValid = updateResult.type !== "error";
    return {
        isValid,
        message: isValid ? null : updateResult.error.message
    };
}


// -------------------------------------------------------------
//  DOMContentLoaded — INITIALIZE STRIPE + BUTTON HANDLERS
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {

    // ----- Fetch publishable key -----
    const configRes = await fetch(`${BACKEND_URL}/checkout/config`, {
        credentials: "include"
    });
    const { publishableKey } = await configRes.json();

    stripe = Stripe(publishableKey);

    // ----- FIXED AMOUNT BUTTONS -----
    document.querySelectorAll(".donate-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            customInput.value = "";
            customAmountCents = null;
            customDonationErrMsg.style.display = "none";
            customInput.classList.remove("invalid");

            document.querySelectorAll(".donate-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");

            selectedPriceID = btn.dataset.priceId;

            updatePayButton();
            initializeCheckout();
        });
    });

    // ----- CUSTOM AMOUNT FIELD -----
    customInput.addEventListener("input", () => {
        const val = Number(customInput.value);

        document.querySelectorAll(".donate-btn").forEach(btn => btn.classList.remove("selected"));
        selectedPriceID = null;

        if (!val || val < 1) {
            customAmountCents = null;
            customInput.classList.add("invalid");
            customDonationErrMsg.style.display = "block";
            updatePayButton();
            return;
        }

        customInput.classList.remove("invalid");
        customDonationErrMsg.style.display = "none";

        customAmountCents = Math.round(val * 100);

        updatePayButton();
        initializeCheckout();
    });

    // Prevent default form submission
    document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
});


// -------------------------------------------------------------
// INITIALIZE CHECKOUT SESSION
// -------------------------------------------------------------
async function initializeCheckout() {

    const res = await fetch(`${BACKEND_URL}/checkout/create-checkout-session`, {
        method: "POST",
        credentials: "include",   // REQUIRED FOR RENDER
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            priceID: selectedPriceID,
            amountCents: customAmountCents
        })
    });

    const { clientSecret } = await res.json();

    const appearance = { theme: "stripe" };

    // Clear old elements
    document.getElementById("payment-element").innerHTML = "";
    document.getElementById("express-checkout-element").innerHTML = "";

    checkout = await stripe.initCheckout({
        clientSecret,
        elementsOptions: { appearance }
    });

    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount("#payment-element");

    const expressCheckoutElement = checkout.createExpressCheckoutElement({
        paymentMethods: {
            applePay: "always",
            googlePay: "always"
        }
    });
    expressCheckoutElement.mount("#express-checkout-element");

    const expressDiv = document.getElementById("express-checkout-element");
    expressDiv.style.visibility = "hidden";

    expressCheckoutElement.on("ready", ({ availablePaymentMethods }) => {
        if (Object.values(availablePaymentMethods).some(Boolean)) {
            expressDiv.classList.remove("hidden");
        } else {
            expressDiv.classList.add("hidden");
        }
    });

    const loadActionsResult = await checkout.loadActions();

    if (loadActionsResult.type === "success") {
        actions = loadActionsResult.actions;

        payButton.disabled = true;

        setupEmailValidation();

        checkout.on("change", session => {
            if (session.canConfirm) {
                payButton.disabled = false;
                payButton.classList.remove("disabled");
            } else {
                payButton.disabled = true;
                payButton.classList.add("disabled");
            }
        });

        expressCheckoutElement.on("confirm", event => {
            actions.confirm({
                expressCheckoutConfirmEvent: event
            });
        });
    }
}


// -------------------------------------------------------------
// EMAIL VALIDATION EVENTS
// -------------------------------------------------------------
function setupEmailValidation() {
    emailInput.addEventListener("input", () => {
        emailErrors.textContent = "";
        emailInput.classList.remove("error");
    });

    emailInput.addEventListener("blur", async () => {
        const email = emailInput.value;
        if (!email) return;

        const { isValid, message } = await validateEmail(email);
        if (!isValid) {
            emailInput.classList.add("error");
            emailErrors.textContent = message;
            showMessage(message);
        }
    });
}


// -------------------------------------------------------------
// HANDLE SUBMIT
// -------------------------------------------------------------
async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
        const email = emailInput.value;
        const { isValid, message } = await validateEmail(email);

        if (!isValid) {
            showMessage(message);
            setLoading(false);
            return;
        }

        const session = actions.getSession();

        if (!session.canConfirm) {
            showMessage("Please complete all required fields before paying.");
            setLoading(false);
            return;
        }

        const { error } = await actions.confirm();

        if (error) showMessage(error.message);

    } catch (err) {
        console.error("Submit Error:", err);
        showMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
}


// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------
function showMessage(messageText) {
    const el = document.querySelector("#payment-message");
    el.classList.remove("hidden");
    el.textContent = messageText;

    setTimeout(() => {
        el.classList.add("hidden");
        el.textContent = "";
    }, 4000);
}

function setLoading(isLoading) {
    payButton.disabled = isLoading;

    const spinner = document.querySelector("#spinner");
    spinner.classList.toggle("hidden", !isLoading);

    buttonText.classList.toggle("hidden", isLoading);
}
