require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { isSupabaseConfigured } = require("./lib/supabaseClient");
const authRoutes = require("./routes/authRoutes");
const customerPetsRoutes = require("./routes/customerPetsRoutes");
const customerAppointmentRoutes = require("./routes/customerAppointmentRoutes");
const customerServicesRoutes = require("./routes/customerServicesRoutes");
const staffRoutes = require("./routes/staffRoutes");
const doctorAppointmentRoutes = require("./routes/doctorAppointmentRoutes");
const doctorProfileRoutes = require("./routes/doctorProfileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { isPrismaConfigured } = require("./lib/prisma");

const app = express();
const port = process.env.PORT || 5050;
const clientUrls = [
  ...(process.env.CLIENT_URL || "http://localhost:5173").split(","),
  ...(process.env.FRONTEND_URL || "").split(","),
]
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin.replace(/\/+$/, ""))) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerPetsRoutes);
app.use("/api/customer/appointments", customerAppointmentRoutes);
app.use("/api/customer/services", customerServicesRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/doctor/appointments", doctorAppointmentRoutes);
app.use("/api/doctor", doctorProfileRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
    supabaseConfigured: isSupabaseConfigured,
    prismaConfigured: isPrismaConfigured,
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

module.exports = app;
