const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { supabase } = require("../../lib/supabaseClient");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async function(req, res) {
  try {
    console.log("[ROUTES] GET /services");

    const { data: services, error } = await supabase
      .from("services")
      .select("id, name, type, price, description, is_active")
      .eq("is_active", true)
      .neq("type", "VACCINE")
      .order("name", { ascending: true });

    if (error) {
      console.error("[ROUTES] GET /services ERROR:", error);
      throw new Error(error.message);
    }

    const serviceTypeLabels = {
      MEDICAL: "Khám bệnh",
      GROOMING: "Grooming",
      BOARDING: "Lưu trú",
      VACCINE: "Tiêm phòng",
      FOOD: "Thức ăn",
      OTHER: "Khác",
    };

    const formattedServices = (services || []).map((svc) => ({
      id: svc.id,
      name: svc.name,
      type: svc.type,
      typeLabel: serviceTypeLabels[svc.type] || svc.type,
      appointmentType: svc.type, // Lưu đúng type từ DB
      price: parseFloat(svc.price),
      description: svc.description || "",
    }));

    console.log("[ROUTES] Found", formattedServices.length, "services");
    res.json({ ok: true, services: formattedServices });
  } catch (error) {
    console.error("[ROUTES] GET /services ERROR:", error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
