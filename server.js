const express = require("express")
const app = express()
const cors = require('cors');
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
require("dotenv").config()

app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/", require("./routes/index"))
app.use("/users", require("./routes/users"))
app.use("/auth", require("./routes/auth"))

const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
