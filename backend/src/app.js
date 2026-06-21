const express = require("express");
const cors = require("cors");

const corsOptions = require("./config/cors");
const { isPrismaConfigured } = require("./lib/prisma");
const { isSupabaseConfigured } = require("./lib/supabaseClient");
const { apiModules } = require("./modules");

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

for (const apiModule of apiModules) {
  app.use(apiModule.path, apiModule.router);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
    supabaseConfigured: isSupabaseConfigured,
    prismaConfigured: isPrismaConfigured,
  });
});

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
  });
});

module.exports = app;
