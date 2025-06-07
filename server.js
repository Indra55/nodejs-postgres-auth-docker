const express = require("express")
const app = express()

const session = require("express-session")
const passport = require("passport")
const flash = require("express-flash")
const initializePassport = require("./config/passportConfig")

const {checkAuthenticated,checkNotAuthenticated} = require("./middleware/auth")
 
require("dotenv").config()

initializePassport(passport)
 
app.set("view engine","ejs") 


app.use(express.urlencoded({extended:false})) 
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,  
}))

app.use(passport.initialize())
app.use(passport.session());
app.use(flash())

app.use("/", require("./routes/index"))
app.use("/users",require("./routes/users"))

const PORT = process.env.PORT || 4100
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
