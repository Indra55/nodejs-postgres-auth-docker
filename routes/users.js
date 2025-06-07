const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const  pool  = require("../config/dbConfig");
const { checkAuthenticated, checkNotAuthenticated } = require("../middleware/auth");

router.get("/login", checkAuthenticated, (req, res) => {
  res.render("login");
});

router.get("/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

router.get("/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.username });
});

router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success_msg", "You are logged out");
    res.redirect("/users/login");
  });
});

router.post("/register", async (req, res) => {
  let { username, email, password } = req.body;
  let errors = [];

  if (!username || !email || !password) {
    errors.push({ message: "Please enter all fields" });
  }
  if (password.length < 7) {
    errors.push({ message: "Password must be at least 8 characters" });
  }

  if (errors.length > 0) {
    return res.render("register", { errors });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  pool.query(`SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
    if (results.rows.length > 0) {
      errors.push({ message: "User already exists" });
      return res.render("register", { errors });
    } else {
      pool.query(`INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id`, 
        [username, email, hashedPassword], (err, result) => {
        req.flash("success_msg", "You are now registered");
        res.redirect("/users/login");
      });
    }
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/users/dashboard",
  failureRedirect: "/users/login",
  failureFlash: true
}));

module.exports = router;
