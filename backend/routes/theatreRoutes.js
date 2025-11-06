import express from "express";
import db from "../db.js";
const router = express.Router();

// All theatres
router.get("/", (req, res) => {
  db.query("SELECT * FROM theatres", (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(rows);
  });
});

// Shows for a theatre, filtered by tmdb_id
router.get("/shows/:theatre_id", (req, res) => {
  const { theatre_id } = req.params;
  const { tmdb_id } = req.query; // <-- read from query

  const sql = `
    SELECT show_id, theatre_id, screen_id, tmdb_id, show_time, ticket_price
    FROM shows
    WHERE theatre_id = ? AND tmdb_id = ?
    ORDER BY show_time ASC
  `;
  db.query(sql, [theatre_id, tmdb_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(rows);
  });
});

export default router;
