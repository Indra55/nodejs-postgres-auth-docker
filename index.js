const express = require("express")
const app = express()
const {pool} = require("./dbConfig")
const bcrypt = require('bcrypt')
const session = require("express-session")
const flash = require("express-flash")
const passport = require("passport")
const initializePassport = require("./passportConfig")

initializePassport(passport)

const PORT = process.env.PORT || 4100

app.set('view engine','ejs') 
app.use(express.urlencoded({extended:false}))

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.get('/',(req,res)=>{
    res.render("index");

})


app.get("/users/login",checkAuthenticated,(req,res)=>{ 
    res.render("login");
})

app.get("/users/register",checkAuthenticated,(req,res)=>{
    res.render("register");
})

app.get("/users/dashboard",checkNotAuthenticated,(req,res)=>{
    res.render("dashboard", {user: req.user.name});
})

app.get("/users/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', "You are logged out");
    res.redirect('/users/login');
  });
});


app.post("/users/register", async (req,res)=>{
    let {name,email,password} = req.body
    console.log({
        name,
        email,
        password
    })

    let errors = []

    if(!name || !email || !password ){
        errors.push({message:"Please enter all fields"})
    }

    if(password.length<7){
        errors.push({message:"Please enter password of alteast 8 characters"})
    }

    if(errors.length>0){
        return res.render("register", {errors})
    }else{
        let hashedPassword = await bcrypt.hash(password,12)

        console.log(hashedPassword)
        pool.query(
            `SELECT * FROM users
            WHERE email = $1`,[email], (err, results)=>{
                if(err){
                    throw err
                }
                console.log(results.rows)
                if(results.rows.length>0){
                    errors.push({message: "User already exists in databse"})
                    res.render('register',{errors})
                }else{
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3) RETURNING id, password`,[name, email, hashedPassword], (err,results)=>{
                            if(err){
                                throw err
                            }
                            console.log(results.rows)
                            req.flash('success_msg', "You are now registered and can log in")
                            res.redirect('/users/login')
                        }
                    )
                }
            }
        )
    }
})

app.post("/users/login", passport.authenticate('local', { 
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
}))

function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        res.redirect('/users/dashboard')
    }
    next()
    
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    req.flash('error_msg', "Please log in to view this resource")
    res.redirect('/users/login')
}

app.listen(PORT,()=>{
    console.log(`HEllo from the server ${PORT}`)
})