// ------- UI Resources -------
const BACKEND_URL = "https://non-profit-backend-s6s9.onrender.com";

// ------- ICONS -------
const SuccessIcon =
`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0,2)">
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M15.4695 0.232963C15.8241 0.561287 15.8454 1.1149 15.5171 1.46949L6.14206 11.5945C5.97228 11.7778 5.73221 11.8799 5.48237 11.8748C5.23253 11.8698 4.99677 11.7582 4.83452 11.5681L0.459523 6.44311C0.145767 6.07557 0.18937 5.52327 0.556912 5.20951C0.924454 4.89575 1.47676 4.93936 1.79051 5.3069L5.52658 9.68343L14.233 0.280522C14.5613 -0.0740672 15.1149 -0.0953599 15.4695 0.232963Z"
      fill="white"/>
  </g>
</svg>`;

const ErrorIcon =
`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd"
    d="M1.25628 1.25628C1.59799 0.914573 2.15201 0.914573 2.49372 1.25628L8 6.76256L13.5063 1.25628C13.848 0.914573 14.402 0.914573 14.7437 1.25628C15.0854 1.59799 15.0854 2.15201 14.7437 2.49372L9.23744 8L14.7437 13.5063C15.0854 13.848 15.0854 14.402 14.7437 14.7437C14.402 15.0854 13.848 15.0854 13.5063 14.7437L8 9.23744L2.49372 14.7437C2.15201 15.0854 1.59799 15.0854 1.25628 14.7437C0.914573 14.402 0.914573 13.848 1.25628 13.5063L6.76256 8L1.25628 2.49372C0.914573 2.15201 0.914573 1.59799 1.25628 1.25628Z"
    fill="white"/>
</svg>`;

function setSessionDetails(session) {
    let statusText = "Something went wrong, please try again.";
    let iconColor = "#DF1B41";
    let icon = ErrorIcon;

    if (!session || session.error) {
        console.log("Session error:", session);
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
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
        console.log("Missing session_id");
        setErrorState();
        return;
    }

    try {
        const response = await fetch(
            `${BACKEND_URL}/checkout/session-status?session_id=${sessionId}`,
            { credentials: "include" }
        );

        const session = await response.json();
        setSessionDetails(session);

    } catch (err) {
        console.error("Fetch error:", err);
        setErrorState();
    }
}
