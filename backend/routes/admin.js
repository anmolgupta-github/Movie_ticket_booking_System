import express from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

// all admin endpoints protected
router.use(requireAuth, requireAdmin);

// STATS
router.get("/stats", (req, res) => {
  const q = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM theatres) AS theatres,
      (SELECT COUNT(*) FROM shows) AS shows,
      (SELECT COUNT(*) FROM bookings) AS bookings
  `;
  db.query(q, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows[0] || {});
  });
});

/* ============== THEATRES ============== */
router.post("/theatres", (req, res) => {
  const { name, city, address } = req.body;
  if (!name || !city) return res.status(400).json({ message: "name & city required" });
  db.query("INSERT INTO theatres (name, city, address) VALUES (?,?,?)",
    [name, city, address || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Insert failed" });
      res.json({ success: true, theatre_id: result.insertId });
    }
  );
});

router.put("/theatres/:id", (req, res) => {
  const { name, city, address } = req.body;
  db.query("UPDATE theatres SET name=?, city=?, address=? WHERE theatre_id=?",
    [name, city, address || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ success: true });
    }
  );
});

router.delete("/theatres/:id", (req, res) => {
  db.query("DELETE FROM theatres WHERE theatre_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

/* ============== SHOWS ============== */
router.get("/shows", (req, res) => {
  db.query("SELECT * FROM shows ORDER BY show_time DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

router.post("/shows", (req, res) => {
  const { theatre_id, tmdb_id, show_time, ticket_price } = req.body;
  if (!theatre_id || !tmdb_id || !show_time || !ticket_price) {
    return res.status(400).json({ message: "Missing fields" });
  }
  db.query(
    "INSERT INTO shows (theatre_id, tmdb_id, show_time, ticket_price) VALUES (?,?,?,?)",
    [theatre_id, tmdb_id, show_time, ticket_price],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Insert failed" });
      res.json({ success: true, show_id: result.insertId });
    }
  );
});

router.delete("/shows/:id", (req, res) => {
  db.query("DELETE FROM shows WHERE show_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

/* ============== MOVIES (LOCAL MAP) ============== */
// simple local mapping table: movies(tmdb_id PK, title, poster_path)
router.get("/movies", (req, res) => {
  db.query("SELECT * FROM movies ORDER BY tmdb_id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

router.post("/movies", (req, res) => {
  const { tmdb_id, title, poster_path } = req.body;
  if (!tmdb_id || !title) return res.status(400).json({ message: "tmdb_id & title required" });
  db.query("REPLACE INTO movies (tmdb_id, title, poster_path) VALUES (?,?,?)",
    [tmdb_id, title, poster_path || null],
    (err) => {
      if (err) return res.status(500).json({ message: "Save failed" });
      res.json({ success: true });
    }
  );
});

router.delete("/movies/:tmdb_id", (req, res) => {
  db.query("DELETE FROM movies WHERE tmdb_id=?", [req.params.tmdb_id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

/* ============== BOOKINGS ============== */
router.get("/bookings", (req, res) => {
  const sql = `
    SELECT b.*, t.name AS theatre_name, s.show_time
    FROM bookings b 
    LEFT JOIN theatres t ON b.theatre_id=t.theatre_id
    LEFT JOIN shows s ON b.show_id=s.show_id
    ORDER BY b.booked_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

router.delete("/bookings/:id", (req, res) => {
  db.query("DELETE FROM bookings WHERE booking_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

/* ============== USERS ============== */
router.get("/users", (req, res) => {
  db.query("SELECT user_id, name, email, role FROM users ORDER BY user_id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

router.put("/users/:id/role", (req, res) => {
  const { role } = req.body; // 'admin' or 'user'
  if (!role) return res.status(400).json({ message: "role required" });
  db.query("UPDATE users SET role=? WHERE user_id=?", [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });
    res.json({ success: true });
  });
});

router.delete("/users/:id", (req, res) => {
  db.query("DELETE FROM users WHERE user_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

export default router;
