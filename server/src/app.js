const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const taskRoutes = require("./routes/taskRoutes");

const aiRoutes = require("./ai/routes/aiRoutes");
const voiceRoutes = require("./voice/routes/voiceRoutes");
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

app.use("/api/ai",aiRoutes);
app.use("/api/voice", voiceRoutes);


app.get("/", (req, res) => {
  res.send("Focus Companion API Running");
});

app.get(
  "/api/test",
  isLoggedIn,
  (req, res) => {
    res.json({
      message: "Protected route accessed",
      user: req.user
    });
  }
);

/* =========================
   Global Error Handler
========================= */
app.use(errorMiddleware);

module.exports = app;