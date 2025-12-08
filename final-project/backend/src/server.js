import express from "express";
import dotenv from "dotenv";
import path from "path"; // builds safe file paths 
import { fileURLToPath } from "url"; // used to recreate __dirname
import { engine } from "express-handlebars";
// import { db } from "./utils/db.js"; // optional

// ROUTERS
import webhookRouter from "./routes/webhook.routes.js";
import checkoutRouter from "./routes/checkout.routes.js"

// ADMIN ROUTERS
import adminDonationsRouter from "./routes/admin/donations.routes.js";
import adminResourcesRouter from "./routes/admin/resources.routes.js";
import adminWorkflowsRouter from "./routes/admin/workflows.routes.js";

// dotenv.config();

// ---------- EXPRESS SETUP ----------------------------------------
// create express app/server
const app = express(); 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// ---------- STRIP WEEBHOOK API -------------------------------
// must come before JSON
// wehooks needs keep req.body as the raw body so that stripes signatiure check dosent fail 
// mount webhook route(POST /webhook) as a path(webhookRouter)
// POST /webhook -> gose to webhookRouter -> router.post("/") 
// The webhook route must use express.raw() at the APP LEVEL
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRouter
);

// ----------  MIDDLEWARE -------------------------------
// express.json() middleware automatically parses JSON request bodies into req.body.
app.use(express.json()); // allows backend read JSON body from requesets
app.use(express.urlencoded({ extended: true })); // allow HTML form bodies from requesrs
app.use(express.static(path.join(__dirname, "../../frontend/public"))); // serve static files in /public folder

// ---------- HANDELBARS VIEW ENGINE --------------------
app.engine("hbs", engine({ extname: ".hbs" }));
app.set("view engine", "hbs");
// path.join(__dirname, "views") == ./Vview folder
app.set("views", path.join(__dirname, "../../frontend/views"));

// ---------- LOGGIN MIDDLEWARE ------------------------------
// log every request
app.use((req, res, next) => {
  console.log("➡️ ", req.method, req.url);
  next();
});

// ---------- API ROUTES --------------------------------------------
app.use("/checkout", checkoutRouter); // reutens pure JSON

// ---------- ADMIN API ROUTES ----------------------------------------
app.use("/admin/donations", adminDonationsRouter);
app.use("/admin/resources", adminResourcesRouter);
app.use("/admin/workflows", adminWorkflowsRouter);

// ---------- PAGE ROUTES ----------------------------------------
// HOME PAGE
app.get("/", (req, res) => {
  // "home" name of .hbs file that will turn into .html file 
  // then send that HTML back to the browser
  // express looks for views/donate.hbs and renders it inside main.hbs {{{body}}}
  res.render("pages/home", {
    title: "Home",
    stylesheet: "home.css",
    donation: true
  });
});

// DONATE PAGE
app.get("/donate", (req, res) => {
  res.render("pages/donate", {
    title: "Donate",
    stylesheet: "donate.css",
    donation: true
  });
});

// COMPLETE PAGE
app.get("/complete", (req, res) => {
  res.render("pages/complete", {
    title: "Payment Complete",
    stylesheet: "complete.css",
    script: "complete.js",
  });
});

// ---------- START SERVER --------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});