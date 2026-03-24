const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

/* =========================
   Routes
========================= */
app.get("/", (req, res) => {
  res.send("Working root");
});

const { isLoggedIn } = require("./middleware/authMiddleware");

app.get("/api/test", isLoggedIn, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user.email });
});


/* =========================
   Global Error Handler
========================= */
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;

  console.error(err);

  res.status(statusCode).json({
    message
  });
});

/* =========================
   Database Connection
========================= */
const PORT = process.env.PORT || 5000;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Database Connection Failed:", error);
  }
}

connectDB();