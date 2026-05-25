const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const {
  getCustomerPetDashboard,
  getPetDetail,
  createCustomerPet,
} = require("../services/customerPetsService");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("customer"));

router.get("/pets", async (req, res) => {
  try {
    const customerId = req.auth.user.customerId;
    const data = await getCustomerPetDashboard(customerId);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load customer pets" });
  }
});

router.get("/pets/:petId", async (req, res) => {
  try {
    const data = await getPetDetail(req.params.petId, req.auth.user.customerId);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load pet detail" });
  }
});

router.post("/pets", async (req, res) => {
  try {
    // Debug: log incoming request body for troubleshooting speciesId issues
    console.debug("[routes] POST /api/customer/pets body:", req.body, "customerId:", req.auth?.user?.customerId);
    const data = await createCustomerPet(req.body ?? {}, req.auth.user.customerId);
    res.status(201).json({ ok: true, pet: data });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to create pet" });
  }
});

module.exports = router;