// avoids importing the entire Express object
// only importing the one function you need (Router)
import { Router } from "express";
import { db } from "../../db/db.js";

const router = Router();

// file is ONLY for admin donation analytics.
// ONLY READS THE DATABASE

// ---------- Admin Endpoints (READ Donations) ---------

// GET /admin/donations → return/list all donations from db
router.get("/", async (req, res) => {
    try{
        // Lists all donations
        const donations = await db.any(
            `SELECT * 
            FROM donations
            ORDER BY created_at DESC`
        );

        res.json(donations);

    } catch {
        console.error("❌ Error fetching donations:", err);
        res.status(500).json({ error: "Failed to load donations" });
    }
});

// GET /admin/donations/stats → charts + insights
router.get("/stats", async (req, res) => {
    try {
        // gets stats for admin dahsboard
        const stats = await db.one(
            `SELECT 
                COUNT(*) AS total_count,
                SUM(amount) AS total_amount
            FROM donations`
        );

        res.json({ stats });

    } catch {
        console.error("❌ Error fetching donation stats:", err);
        res.status(500).json({ error: "Failed to load stats" });
    }
});


export default router;
