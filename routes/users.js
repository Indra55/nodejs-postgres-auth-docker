const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
const { checkAuthenticated, checkNotAuthenticated } = require("../middleware/auth");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

router.get("/dashboard", checkAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "You are logged out" });
});

router.post("/register", checkNotAuthenticated, async (req, res) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || !email || !password) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password && password.length < 8) {
    errors.push({ message: "Password must be at least 8 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ errors: [{ message: "User already exists" }] });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);
    res.status(201).json({ message: "You are now registered", user, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", checkNotAuthenticated, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);
    res.json({
      message: "Logged in successfully",
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;