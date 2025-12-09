// Because frontend + backend run on the same domain (Render backend),
// do NOT include the full backend URL anymore.
const BACKEND_URL = "";

// Stripe.js client created with publishable key
let stripe; 
let checkout;
let actions;

const customInput = document.getElementById("custom-amount");
const customDonationErrMsg = document.getElementById("custom-error");

const payButton = document.getElementById("submit");
const buttonText = document.querySelector("#button-text");

const emailInput = document.getElementById("email");
const emailErrors = document.getElementById("email-errors");

let selectedPriceID = null;
let customAmountCents = null;

// Update Pay Now button text based on selected/custom amount
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

// Validate email via Stripe
async function validateEmail(email) {
    const updateResult = await actions.updateEmail(email);
    const isValid = updateResult.type !== "error";
    return { isValid, message: !isValid ? updateResult.error.message : null };
}

// Initialize whole page
document.addEventListener("DOMContentLoaded", async () => {
    const configRes = await fetch(`/checkout/config`);
    const { publishableKey } = await configRes.json();

    stripe = Stripe(publishableKey);

    // Fixed amount buttons
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

    // Custom amount field
    customInput.addEventListener("input", () => {
        const customValue = Number(customInput.value);

        document.querySelectorAll(".donate-btn").forEach(btn => btn.classList.remove("selected"));
        selectedPriceID = null;

        if (!customValue || customValue < 1) {
            customAmountCents = null;
            customInput.classList.add("invalid");
            customDonationErrMsg.style.display = "block";
            updatePayButton();
            return;
        }

        customInput.classList.remove("invalid");
        customDonationErrMsg.style.display = "none";
        customAmountCents = Math.round(customValue * 100);

        updatePayButton();
        initializeCheckout();
    });

    document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
});

// Create Stripe Checkout session
async function initializeCheckout() {
    const res = await fetch(`/checkout/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            priceID: selectedPriceID,
            amountCents: customAmountCents
        })
    });

    const { clientSecret } = await res.json();

    checkout = await stripe.initCheckout({
        clientSecret,
        elementsOptions: { appearance: { theme: "stripe" } }
    });

    const paymentElementContainer = document.getElementById("payment-element");
    const expressContainer = document.getElementById("express-checkout-element");
    paymentElementContainer.innerHTML = "";
    expressContainer.innerHTML = "";

    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount("#payment-element");

    const expressCheckoutElement = checkout.createExpressCheckoutElement({
        paymentMethods: { applePay: "always", googlePay: "always" }
    });
    expressCheckoutElement.mount('#express-checkout-element');

    const expressCheckoutDiv = document.getElementById('express-checkout-element');
    expressCheckoutDiv.style.visibility = "hidden";

    expressCheckoutElement.on('ready', ({ availablePaymentMethods }) => {
        if (Object.values(availablePaymentMethods).some(Boolean)) {
            expressCheckoutDiv.classList.remove("hidden");
        } else {
            expressCheckoutDiv.classList.add("hidden");
        }
    });

    const loadActionsResult = await checkout.loadActions();
    if (loadActionsResult.type === "success") {
        actions = loadActionsResult.actions;

        payButton.disabled = true;

        setupEmailValidation();

        checkout.on("change", (session) => {
            if (session.canConfirm) {
                payButton.disabled = false;
                payButton.classList.remove("disabled");
            } else {
                payButton.disabled = true;
                payButton.classList.add("disabled");
            }
        });

        expressCheckoutElement.on("confirm", (event) => {
            loadActionsResult.actions.confirm({
                expressCheckoutConfirmEvent: event
            });
        });
    }
}

// Setup email validation handlers
function setupEmailValidation() {
    emailInput.addEventListener("input", () => {
        emailErrors.textContent = "";
        emailInput.classList.remove("error");
    });

    emailInput.addEventListener("blur", async () => {
        const newEmail = emailInput.value;
        if (!newEmail) return;

        const { isValid, message } = await validateEmail(newEmail);
        if (!isValid) {
            emailInput.classList.add("error");
            emailErrors.textContent = message;
            showMessage(message);
        }
    });
}

// Submit handler: confirm payment
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
        showMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
}

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
    document.querySelector("#spinner").classList.toggle("hidden", !isLoading);
    buttonText.classList.toggle("hidden", isLoading);
}
