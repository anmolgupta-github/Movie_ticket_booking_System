import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ Create Booking
router.post("/book", (req, res) => {
  const { user_id, tmdb_id, theatre_id, show_id, selected_seats } = req.body;

  if (!user_id || !tmdb_id || !theatre_id || !show_id || !selected_seats?.length) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO bookings (user_id, tmdb_id, theatre_id, show_id, seats)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, tmdb_id, theatre_id, show_id, JSON.stringify(selected_seats)], (err) => {
    if (err) {
      console.error("❌ Booking Insert Error:", err);
      return res.status(500).json({ success: false, message: "Server error while saving booking" });
    }

    res.json({ success: true, message: "🎟️ Booking confirmed!" });
  });
});

// ✅ Fetch Bookings (updated to match your schema)
router.get("/bookings/:user_id", (req, res) => {
  const { user_id } = req.params;

  // 🧠 FIXED JOIN — use shows.screen_id instead of shows.theatre_id
  const sql = `
    SELECT 
      b.*, 
      t.name AS theatre_name, 
      t.city AS theatre_city,
      s.show_time
    FROM bookings b
    LEFT JOIN theatres t ON b.theatre_id = t.theatre_id
    LEFT JOIN shows s ON b.show_id = s.show_id
    WHERE b.user_id = ?
    ORDER BY b.booked_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("❌ Fetch Bookings Error:", err);
      return res.status(500).json({ success: false, message: "Server error loading bookings" });
    }

    if (!results.length) {
      console.log("⚠️ No bookings found for user:", user_id);
    }

    res.json(results);
  });
});

// ✅ Delete Booking
router.delete("/book/:booking_id", (req, res) => {
  const { booking_id } = req.params;

  if (!booking_id) {
    return res.status(400).json({ success: false, message: "Booking ID is required" });
  }

  const sql = `DELETE FROM bookings WHERE booking_id = ?`;

  db.query(sql, [booking_id], (err, result) => {
    if (err) {
      console.error("❌ SQL Delete Error:", err);
      return res.status(500).json({ success: false, message: "Server error while deleting booking" });
    }

    if (result.affectedRows > 0) {
      console.log("✅ Deleted booking:", booking_id);
      res.json({ success: true, message: "Booking deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Booking not found" });
    }
  });
});

export default router;
