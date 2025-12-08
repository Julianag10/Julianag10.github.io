// Stripe.js client created with publishable key
let stripe; 

// the checkout controller for the checkoutsession i created on my server
// checkout obejct is my controller that operates on the STIPES CHECKPUT SESISON OBJECT
// it lets me inetract with stipes checkoursession object with the methods in actions
// or by adding payment elemnts, express checkout element and pamymetn methods
let checkout;

// holds the Actions API (methods like updateEmail(), confirm(), ect)
// actions is an object full of methods BOUND TO THE ACTIVE CHECKOUT SESSION
// actions object that comes from checkout.loadActions()
// actions allows us to interact with the checkout session object
let actions;

const customInput = document.getElementById("custom-amount");
const customDonationErrMsg = document.getElementById("custom-error");

const payButton = document.getElementById("submit");
const buttonText = document.querySelector("#button-text")

const emailInput = document.getElementById("email");
const emailErrors = document.getElementById("email-errors");

let selectedPriceID = null;
let customAmountCents = null;

// ==============================================================================================
// update payButton text live as user type custom amount, or decides to do a fixed donation
// call when user clicks a preset amount, or types a custom amountm or fomr resets
function updatePayButton(){
    if(selectedPriceID){ 
        // finds teh buttont ht visuallt has the .selected class
        const selectedBtn = document.querySelector(".donate-btn.selected");
        if (selectedBtn) { // Stripe Elements remounting can clear DOM state
            // const session = actions.getSession();
            // const amountDisplay = session.total.total.amount
            const selectedAmount = selectedBtn.innerText.replace("$", "");
            buttonText.textContent = `Pay $${selectedAmount} now`;
        }
    } else if (customAmountCents) {
        // const session = actions.getSession();
        // const amountDisplay = session.total.total.amount
        buttonText.textContent  = `Pay $${(customAmountCents / 100).toFixed(2)} now`;
    } else {
        buttonText.textContent = "Pay now";
    }
}
// ==============================================================================================
async function validateEmail(email) {
    // updateEmail(email) ATTEMPTS to attach emial to STRIPE checkout session
    const updateResult = await actions.updateEmail(email);
    // object returned by actions.updateEmail(email)
    // case 1: SUCCESS
    // {    type: "sucess",
    //      session: { stripe session object, with update email field}  }
    // case 2: ERROR 
    // {    type: "error",
    //      error: { message: "Invalid email address" } }

    const isValid = updateResult.type !== "error"; // put true or false into isValid

    // returns the error: message from Stripes JSON responce
    // (condition ? A : B) returns A if the condition is true, else B
    return { isValid, message: !isValid ? updateResult.error.message : null };
};
// ==============================================================================================
document.addEventListener("DOMContentLoaded", async () => {
    // asks server for the publishable key( safe to expose)
    const configRes = await fetch("/config"); 
    const {publishableKey} = await configRes.json();
    
    // initalise stripe.js with publushable key
    // gives me a stripe client object, with methods i call in the browser
    stripe = Stripe(publishableKey);
    
    // ----------- FIXED AMOUNT BUTTONS --------------
    document.querySelectorAll(".donate-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            // Clear custom input if a fixed amount button is pressed
            customInput.value = "";
            customAmountCents = null; // for server body
            customDonationErrMsg.style.display = "none";
            customInput.classList.remove("invalid");
            
            // unselect any selected buttons
            document.querySelectorAll(".donate-btn").forEach(b => b.classList.remove("selected"));
            // highlight the selected button
            btn.classList.add("selected");

            // .dataset an object that holds all data-* attributes on that elemetn
            // HTML attribute that starts with data- becomes available automatically under that element’s .dataset
            selectedPriceID = btn.dataset.priceId;

            // Update Pay button text each time user clicks a new fixed amount button
            updatePayButton();
            // Create / refresh Checkout Session for this fixed amount
            initializeCheckout();
        });
    });

    // ----------- CUSSTOM AMOUNT INPUT  --------------
    customInput.addEventListener("input", () => {
        const customValue = Number(customInput.value);

        // Reset preset buttons
        document.querySelectorAll(".donate-btn").forEach (btn => {
            btn.classList.remove("selected");
        });

        // Need to clear fixed amount selected so 
        selectedPriceID = null; 

        // invalid value
        if (!customValue || customValue < 1) {
            customAmountCents = null; // sends to updatePayButton()
            customInput.classList.add("invalid");
            customDonationErrMsg.style.display = "block";
            updatePayButton();
            return;
        }

        // Valid custom amount
        customInput.classList.remove("invalid");
        customDonationErrMsg.style.display = "none";
        customAmountCents = Math.round(customValue* 100);

        console.log(`custom donation: $${customValue} (${customAmountCents} cents)`);
        updatePayButton();
        initializeCheckout();
    });

    // stops sensitive card info form beign sent as an HTTP request to teh url in the foroms action attribute
    document.querySelector("#payment-form")
    .addEventListener("submit", handleSubmit);
});
// ==============================================================================================
async function initializeCheckout(){
    // sending a json message to server, sending correct session payload
    const res = await fetch("/create-checkout-session" , {
        method: 'POST',
        headers: {'Content-Type' : 'application/json'},
        // taking a js object ({amount:2500}) adn turn it into a JSON string, because HTTPS requests only send text
        body: JSON.stringify({ 
            priceID: selectedPriceID, 
            amountCents: customAmountCents 
        })
    });

    // clientSecret ties your front-end Stripe Elements to the backend-created Checkout Session.
    const { clientSecret } = await res.json();

    // CUSTOMEIXE THE PAYMENT ELEMETN UI 
    const appearance = {
        theme:'stripe',
    };

    // Clear old Elements if user changes amount or if user clicks $1 button twice
    const paymentElementContainer = document.getElementById("payment-element");
    const expressContainer = document.getElementById("express-checkout-element");
    paymentElementContainer.innerHTML = "";
    expressContainer.innerHTML = "";

    // init checkout browser session obeject w/ clientSecert
    // in server created and linked a checkout: session: payment intetn, and thrn strip sends back the client secret that specfies with checkout session object we are workign with
    // then in front end use that client secrete so we can use the same checkout session we created in server
    // because they were created adn linked but onyl in stripes servers, so front end dosent know yet which checkout session belongs to it
    checkout =  await stripe.initCheckout({
        clientSecret, 
        elementsOptions: {appearance},
    });
    // STRIPE CHECKOUT SESSION PBJEct CONTROLLER
    // interacts with stripes CheckoutSession Object
    // allows me to talk to stirpe's API about the session
    // checkout = {
    //     clientSecret: "...",
    //     on(event, callback) {...},
    //     loadActions: async () => {...},
    //     createPaymentElement: () => {...},
    //     // (internal Stripe state)
    // }

    // actions = {
    //     getSession: () => session{...},      // reads the live Checkout Session object
    //     updateEmail: (email) => {...},// sets customer email
    //     confirm: () => {...},         // tells Stripe to confirm the PaymentIntent
    //     cancel: () => {...},          // (optional)
    //     // etc.
    // }

    // DATA -STRipes CHECOUT SESSION OBJECT RECORD
    // session is A BROWSER COOPY OF STRIPESCHEKOUT SESSION OBJECT
    // session = {
    //     object: "checkout.session",
    //     id: "cs_test_123",
    //     status: "open",          // open | complete | expired
    //     currency: "usd",
    //     total: {
    //         total: {
    //         amount: 2500,        // in cents
    //         currency: "usd"
    //         }
    //     },
    // BECUASE ACTION.CANCONFIRM WORKS ON SESSION WHICH IS A COPY OF STRIPES SESSION OBEJCT, 
    //     canConfirm: false,       // becomes true when form complete
    //     payment_intent: "pi_abc123",
    //     customer_email: "user@example.com"
    // }

    // paymentIntent = {
    //     object: "payment_intent",
    //     id: "pi_abc123",
    //     amount: 2500,
    //     currency: "usd",
    //     status: "requires_confirmation", // or "processing", "succeeded", etc.
    //     payment_method: "pm_card_visa",
    // }

    console.log("Stripe object:", Stripe);
    console.log("Stripe instance:", stripe);  

    // ---------- PAYMENT ELEMENT ----------
    // Creates the secure card entry UI
    // Handles CVC checks, expiration, card brand detection
    // Automatically validates fields
    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount("#payment-element");
    // You can customize the appearance of all Elements by passing elementsOptions.appearance when initializing Checkout on the front end.

    // ---------- EXPRESS CHEKOUTOUT ELEMENT ----------
    const expressCheckoutElement = checkout.createExpressCheckoutElement({
        paymentMethods: {
            applePay: "always",
            googlePay: "always",
        },
    });
    expressCheckoutElement.mount('#express-checkout-element');

    // express checkout ele is imitally hidden unitl stripe confirms avaliablity
    const expressCheckoutDiv = document.getElementById('express-checkout-element');
    // expressCheckoutDiv.classList.add("hidden");
    expressCheckoutDiv.style.visibility = "hidden";

    // Listen for the "ready" event (fires when Stripe finishes wallet checks)
    expressCheckoutElement.on('ready', ({ availablePaymentMethods }) => {
        console.log('Wallet availability:', availablePaymentMethods);
    // When Stripe emits the "ready" event, it sends:
    // availablePaymentMethods = { 
    //      applePay: true/false
    //      googlePay: true/false  
    // }

    // If at least one fast-pay method is available, show the element
    // Object is a built-in global object that gives you utility functions for working with objects, Object.values()
    // Object.values(anyObject) → [true, false, true] returns an array of all the property values from that object
    // Array.prototype.some() is an array method.
    // It checks whether at least one element in the array passes a test (returns true)
        if (Object.values(availablePaymentMethods).some(Boolean)) {
            expressCheckoutDiv.classList.remove("hidden");
        } else {
            expressCheckoutDiv.classList.add("hidden");
            console.log('No express checkout wallets available on this device.');
        }
    });

    // ---------- LOAD ACTIONS ----------
    // Ask checkout controller for Actions API bound to active Checkout Session(created in server)
    const loadActionsResult = await checkout.loadActions();
    // checkout.loadActions() returns a object w/ functions bound to checkout Session:
    // {type: "error", error: { message: string }}
    // {type: "success", actions: object }
    // actions.getSession() → gives you the session snapshot.
    // actions.updateEmail() → edits that session’s email.

    if(loadActionsResult.type === "success"){
        // loads the methods into actions object
        actions = loadActionsResult.actions;

        // Keep payment button disabled until Stripe session is says Ok
        // user must fill email, card info
        payButton.disabled = true;

        // fetches the Checkout Session snapshot from Stripe.
        // const session = actions.getSession();
        
        setupEmailValidation();

        // if something changes on stripes side, (update email, ect)
        // checkout.on("change") event sends you a new updated snapshot == send you a new session obejct
        checkout.on("change", (session) => {
            console.log("Checkout session changed:", session);

            // canConfirm checks if the session has all the inputs it needs for confirming the paymetn intent
            // Enable or disable the button based on canConfirm
            if (session.canConfirm) {
                payButton.disabled = false;
                payButton.classList.remove("disabled");
            } else {
                payButton.disabled = true;
                payButton.classList.add("disabled");
            }
        });

        // Express Checkout Element (wallet button) is an event emitter
        // When shopper approves ApplePay/GooglePay in the native sheet, the Element emits a confirm event
        // expressCheckoutElement collects & authorizes the wallet payment → fires confirm
        expressCheckoutElement.on('confirm', (event) => {
            // tells Stripe: “Use the wallet result u just gave me (event) to confirm the PaymentIntent that’s attached to this Checkout Session.”
            // the event object is {expressCheckoutConfirmEvent: event}}
            // Passing { expressCheckoutConfirmEvent: event } binds that specific wallet authorization to the session’s PaymentIntent
            // Stripe then completes the payment (server-side), and will either redirect or or update the embedded UI.
            loadActionsResult.actions.confirm({
                expressCheckoutConfirmEvent: event
            });
        });
    }
}
// ==============================================================================================
function setupEmailValidation() {
    // collecr the cusotmers emial
    // as the user types, clear any previous error and remove error styleing
    emailInput.addEventListener("input", () => {
        emailErrors.textContent = "";
        emailInput.classList.remove("error");
    });

    // "blur" fires when input looses focus, when "blur" validate via actions.update email 
    emailInput.addEventListener("blur", async () => {
        const newEmail = emailInput.value;
        if(!newEmail)
            return; // if the new email feild is empty do nothng

        // checking if email is valid after loosing focus
        const { isValid, message } = await validateEmail(newEmail);
        if(!isValid){
            emailInput.classList.add("error");
            // message is the error.message from updateEmail(email)
            // put the eroor messae in the <div id="emailErrors">
            emailErrors.textContent = message;
            showMessage(message);
        }
    });
}
// ==============================================================================================
// handel any immediate errors
// confirmthe paymetn wit stripe through payment elemtn 
async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); // START LOADING when submit button is pressed

    try{
        // double check the email before confirmation
        const email = emailInput.value;
        const {isValid, message} = await validateEmail(email);
        if(!isValid){
            // emailInput.classList.add("error");
            // emailErrors.textContent = message;
            showMessage(message);
            setLoading(false);
            return;
        }

        // Check if Stripe is ready to confirm
        const session = actions.getSession();
        if (!session.canConfirm) {
            showMessage("Please complete all required fields before paying.");
            setLoading(false);
            return;
        }

        // CONFIRM THE PAYMENT INTENT with actions.confirm() already exsts in checkout session
        // confirm() tells stirpe, customer entered all info, now try to complete/proccess the PaymentIntent.”
        // moves the payment intetnt's stauts(staemachine)  → processing
        // stripe will attempt to charge the payment method
        // if it fails immeditaly (invalid card, expired, etc.), it throws an error object right there.
        // otherwise custmer will be redirect to return url
        const { error } = await actions.confirm();   // ← use saved actions

        // This point will only be reached if there is an immediate error when confirming the payment
        // if .confirm() didnt redirect show error immediatly
        if (error) showMessage(error.message);

    } catch(err){ // cathc netwrok/runtime.Javascript erros 
        console.error("Error in handleSubmit:", err);
        showMessage("Something went wrong. Please try again.");
    }
    // restores button state
    setLoading(false);  // STOP LOADING 
}
// -------------HELPERS-------------
// ==============================================================================================
function showMessage(messageText){
    const el = document.querySelector("#payment-message");
    el.classList.remove("hidden");
    el.textContent = messageText;
    // renders a temporay notificatin to the user 
    setTimeout(() => {
        el.classList.add("hidden");
        el.textContent = "";
    }, 4000);
}
// ==============================================================================================
function setLoading(isLoading){
    // HTML form controls like <button> & <input> have builtin BOOLEAN property called DISABLED
    payButton.disabled = isLoading

    // .toggle(className, optional boolean)
    // if optional boolean = true => forces the class to be added
    // if optional boolean = false => forces the class to be removed
    const spinner = document.querySelector("#spinner");
    // spinner visable only when loading
    spinner.classList.toggle("hidden", !isLoading);

    // hides button text if loading
    buttonText.classList.toggle("hidden", isLoading);
}
