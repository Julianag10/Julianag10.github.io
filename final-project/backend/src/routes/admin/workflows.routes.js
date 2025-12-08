import { Router } from "express";

const router = Router();

// A workflow routes file → For admin UI
// A workflow logic file → For backend automation

// They work together:
    // Admin creates rules
    // Backend runs rules
    
router.get("/", (req, res) => {
  res.json({ message: "workflows admin API ready" });
});

export default router;
