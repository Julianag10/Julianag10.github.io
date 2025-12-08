import { Router } from "express";

const router = Router();

// Admins need to manage website content (“resources” page).

// POST /admin/resources → create resource
// PUT /admin/resources/:id → update
// DELETE /admin/resources/:id → delete
// GET /resources → public listing
router.get("/", (req, res) => {
  res.json({ message: "resources admin API ready" });
});

export default router;
