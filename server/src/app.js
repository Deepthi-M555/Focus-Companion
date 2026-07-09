const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const taskRoutes = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");
const setupRoutes = require("./routes/setupRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const userRoutes = require("./routes/userRoutes");

const aiRoutes = require("./ai/routes/aiRoutes");

const focusVoiceRoutes = require("./voice/routes/voiceRoutes");
const { isLoggedIn } = require("./middleware/authMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());

app.use(express.json());

/* =========================
   Routes
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);

app.use("/api/ai",aiRoutes);

app.use("/api/voice", focusVoiceRoutes);

app.get("/", (req, res) => {
  res.send("Focus Companion API Running");
});

app.get(
  "/api/test",
  isLoggedIn,
  (req, res) => {
    res.json({
      message: "Protected route accessed",
      user: req.identity
    });
  }
);

/* =========================
   Global Error Handler
========================= */
app.use(errorMiddleware);

module.exports = app;
