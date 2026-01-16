const express = require("express")
const app = express()
const cors = require('cors');
const cookieParser = require("cookie-parser");
require("dotenv").config()

app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use("/", require("./routes/index"))
app.use("/users", require("./routes/users"))

const PORT = process.env.PORT || 4100
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
