// =============================================================
// EMAIL UTILITY — sends all email types from webhook + checkout
// =============================================================
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// nodemailer creats a transporter object
// transporter object is  configured to use Mail trap(or SMTP or GMAIL or AWS SES) to send emails
// transporter object is like: “my email sending machine.”
// here using Mailtrap, which is a fake inbox for testing emails.
const transporter = nodemailer.createTransport({
    // host -> Mailtrap’s SMTP server.
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    // auth.user & auth.pass -> your Mailtrap credentials from .env
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

// ---------- EMAIL SUCCESSFUL DONATION RECIPT --------------------
export async function sendConfirmationEmail({ name, email, amount }) {
    if (!email) return;

    const HTML = `
        <h2>Thank you for your donation!</h2>
        <p>Hi ${name || "friend"},</p>
        <p>We received your donation of <strong>$${amount}</strong>. This email serves as your receipt.</p>
    `;

    await transporter.sendMail({
        from: '"Vive Wellness" <donations@vive.org>',
        to: email,
        subject: "Your Donation Receipt",
        html: HTML  // html: the HTML body we built above.
    });

    console.log("📧 Sent confirmation email to: ", email);
}

// ---------- EMAIL PAYMENT FAILED --------------------
export async function sendPaymentFailedEmail({email, reason, retryUrl}){
    if(!email) return;

    const HTML = `
        <h2>We attempted to process your donation but the payment failed.</h2>
        <p>Reason: </p>
        ${reason}
        <p>YOu can try again here:</p>
        <a href="${retryUrl}" 
            style="display:inline-block;padding:10px 18px;background:#007bff;color:white;border-radius:6px;text-decoration:none;">
            Retry Donation
        </a>
    `;

    await transporter.sendMail({
        from: '"Vive Wellness" <donations@vive.org>',
        to: email,
        subject: "YOur donation could not be completed",
        html: HTML  // html: the HTML body we built above.
    });

    console.log("📧 Sent payment failed email to: ", email);
}

// ---------- EMAIL PAYMENT FAILED --------------------
export async function sendRefundEmail({email, amount}){
    if(!email) return;

    const HTML = `
        <h2>Your Donation of $ ${amount.toFixed(2)} has been refunded .</h2>
        <p>Reason: </p>
        ${reason}
    `;

    await transporter.sendMail({
        from: '"Vive Wellness" <donations@vive.org>',
        to: email,
        subject: "YOur donation was refunded",
        html: HTML  // html: the HTML body we built above.
    });

    console.log("📧 Sent refund email to: ", email);
}

// ---------- DISPUTE ALERT TO ADMIN --------------------
export async function sendDisputeAlertEmail({ chargeId, amount }){
    const admin = process.env.ADMIN_EMAIL || "admin@vive.org";

    const HTML = `
        <h2> a dispute has been filed.</h2>
        <p><strong>charge ID:</strong> </p>
        ${chargeId}
        <p><strong>Amount:</strong> </p>
        ${amount.toFixed(2)}

        <p>This means the donor contacted their bank and claimed the charge was fraudulent or unauthorized.</p>
        <p>You must log in to Stripe to respond to this dispute in Stripe Dash Board:</p>
        <a href="https://dashboard.stripe.com/disputes" 
            style="display:inline-block;padding:10px 18px;background:#007bff;color:white;border-radius:6px;text-decoration:none;">>
            Open Stripe Disputes Dashboard
        </a>

        <p>Next steps:</p>
        <ul>
            <li>Review donor information</li>
            <li>Upload any evidence (receipts, IP logs, confirmations)</li>
            <li>Submit evidence or accept the dispute</li>
        </ul>
    `;  

    await transporter.sendMail({
        from: '"Vive Wellness" <donations@vive.org>',
        to: admin,
        subject: "Donation dispute opened",
        html: HTML  // html: the HTML body we built above.
    });

    console.log("📧 Sent dispute email to admin: ", admin);
}

// ---------- ABANDONED CHECKOUT --------------------
export async function sendAbandonedCheckoutEmail({ email, resumeUrl }){
    if(!email) return;

    const HTML = `
        <h2>ou started a donation but didn’t finish..</h2>
        <p>You can complete it here: </p>
        <a href="${resumeUrl}" 
            style="display:inline-block;padding:10px 18px;background:#007bff;color:white;border-radius:6px;text-decoration:none;">
            Complete Donation
        </a>
    `;

    await transporter.sendMail({
        from: '"Vive Wellness" <donations@vive.org>',
        to: email,
        subject: "Finsih your donation to vive",
        html: HTML  // html: the HTML body we built above.
    });

    console.log("📧 Sent abandond session email to: ", email);
}