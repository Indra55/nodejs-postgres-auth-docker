const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
const { checkAuthenticated, checkNotAuthenticated } = require("../middleware/auth");

const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

// Dashboard - Protected
router.get("/dashboard", checkAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "You are logged out" });
});

// Register
router.post("/register", checkNotAuthenticated, async (req, res) => {
  let { username, email, password } = req.body;
  let errors = [];

  if (!username || !email || !password) {
    errors.push({ message: "Please enter all fields" });
  }
  if (password.length < 8) {
    errors.push({ message: "Password must be at least 8 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    pool.query(`SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      if (results.rows.length > 0) {
        errors.push({ message: "User already exists" });
        return res.status(400).json({ errors });
      } else {
        pool.query(`INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email`,
          [username, email, hashedPassword], (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Database error" });
            }
            const user = result.rows[0];
            const token = generateToken(user);
            res.cookie("token", token, { httpOnly: true });
            res.status(201).json({ message: "You are now registered", user, token });
          });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", checkNotAuthenticated, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username, email: user.email }, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
