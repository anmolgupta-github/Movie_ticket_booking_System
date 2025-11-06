import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

/* ===============================
   🧾 PUBLIC ROUTES (No Auth Needed)
   =============================== */

// 🔹 Register new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const [user] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [name, email, hashed]
    );

    const token = jwt.sign(
      { id: result.insertId, name, email, role: "user" },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );

    res.json({ success: true, message: "Registration successful", token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 🔹 Login existing user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user.user_id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* ===============================
   🔐 PROTECTED ADMIN ROUTES
   =============================== */
router.use(requireAuth, requireAdmin);

// 📊 Stats
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

// 📍 Theatres CRUD (admin only)
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

export default router;
