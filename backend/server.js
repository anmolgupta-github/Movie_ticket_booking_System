// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import theatreRoutes from "./routes/theatreRoutes.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();

// ✅ Middleware (must come before routes)
app.use(cors({
  origin: "http://127.0.0.1:5500", // frontend (Live Server)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api", bookingRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Default test route
app.get("/", (req, res) => {
  res.json({ message: "✅ Server running and DB connected!" });
});

// ✅ Backup booking route (for safety)
app.post("/api/book", async (req, res) => {
  try {
    const { user_id, tmdb_id, theatre_id, show_id, selected_seats } = req.body;

    if (!user_id || !tmdb_id || !theatre_id || !show_id || !selected_seats?.length) {
      return res.json({ success: false, message: "⚠️ Missing required fields" });
    }

    await db.query(
      "INSERT INTO bookings (user_id, tmdb_id, theatre_id, show_id, seats) VALUES (?, ?, ?, ?, ?)",
      [user_id, tmdb_id, theatre_id, show_id, JSON.stringify(selected_seats)]
    );

    res.json({ success: true, message: "🎟️ Booking confirmed!" });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ success: false, message: "Server error while saving booking" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
