// On unified server, same-origin requests → no BACKEND_URL needed
const BACKEND_URL = "";

const SuccessIcon = `<svg ...></svg>`;
const ErrorIcon = `<svg ...></svg>`;
const InfoIcon = `<svg ...></svg>`;

function setSessionDetails(session) {
    let statusText = "Something went wrong.";
    let iconColor = "#DF1B41";
    let icon = ErrorIcon;

    if (!session) {
        setErrorState();
        return;
    }

    switch (session.status) {
        case "complete":
            statusText = "Payment Succeeded";
            iconColor = "#30B130";
            icon = SuccessIcon;
            break;

        case "open":
            statusText = "Payment Failed";
            iconColor = "#DF1B41";
            icon = ErrorIcon;
            break;
    }

    document.querySelector("#status-icon").style.backgroundColor = iconColor;
    document.querySelector("#status-icon").innerHTML = icon;
    document.querySelector("#status-text").textContent = statusText;

    document.querySelector("#intent-status").textContent = session.status;
    document.querySelector("#intent-id").textContent = session.payment_intent_id;
    document.querySelector("#payment-intent-status").textContent = session.payment_status;
    document.querySelector("#session-status").textContent = session.payment_intent_status;

    document.querySelector("#view-details").href =
        `https://dashboard.stripe.com/payments/${session.payment_intent_id}`;
}

function setErrorState() {
    document.querySelector("#status-icon").style.backgroundColor = "#DF1B41";
    document.querySelector("#status-icon").innerHTML = ErrorIcon;
    document.querySelector("#status-text").textContent =
        "Something went wrong, please try again.";
    document.querySelector("#details-table").classList.add("hidden");
    document.querySelector("#view-details").classList.add("hidden");
}

initialize();

async function initialize() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
        setErrorState();
        return;
    }
    // i ust changed this

    const response = await fetch(`/session-status?session_id=${sessionId}`);
    const session = await response.json();

    setSessionDetails(session);
}
