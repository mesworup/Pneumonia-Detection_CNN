require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Validate required environment variables at startup
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "GEMINI_API_KEY"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(
    `FATAL: Missing required environment variables: ${missingVars.join(", ")}`,
  );
  console.error(
    "Please set them in your .env file. See .env.example for reference.",
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const userRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const User = require("./models/User");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// Serve Uploads
app.use("/uploads", express.static("uploads"));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Seed Admin User
    try {
      const adminExists = await User.findOne({
        email: "admin@pneumodetect.com",
      });
      if (!adminExists) {
        // Require ADMIN_PASSWORD in production, allow default in development
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          if (process.env.NODE_ENV === "production") {
            console.error(
              "ERROR: ADMIN_PASSWORD is required in production environment",
            );
            process.exit(1);
          } else {
            console.warn(
              "WARNING: ADMIN_PASSWORD not set. Using default password. Set ADMIN_PASSWORD in .env for production!",
            );
          }
        }
        await User.create({
          name: "Admin User",
          email: "admin@pneumodetect.com",
          password: adminPassword,
          role: "admin",
        });
        console.log("Default Admin Created");
      }
    } catch (error) {
      console.error("Admin Seeding Error:", error);
    }
  })
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Basic Route
app.get("/", (req, res) => {
  res.send("Pneumonia Detection API is running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
