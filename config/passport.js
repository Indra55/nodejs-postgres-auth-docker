const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./dbConfig");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Google ID
                const existingUser = await pool.query(
                    "SELECT * FROM users WHERE google_id = $1",
                    [profile.id]
                );

                if (existingUser.rows.length > 0) {
                    // User exists, return it
                    return done(null, existingUser.rows[0]);
                }

                // Check if user exists with the same email (for account linking)
                const email = profile.emails?.[0]?.value;
                if (email) {
                    const emailUser = await pool.query(
                        "SELECT * FROM users WHERE email = $1",
                        [email]
                    );

                    if (emailUser.rows.length > 0) {
                        // Link Google account to existing user
                        const updatedUser = await pool.query(
                            "UPDATE users SET google_id = $1, avatar = $2 WHERE email = $3 RETURNING *",
                            [profile.id, profile.photos?.[0]?.value, email]
                        );
                        return done(null, updatedUser.rows[0]);
                    }
                }

                // Create new user
                const newUser = await pool.query(
                    `INSERT INTO users (username, email, google_id, avatar, auth_provider) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, username, email, google_id, avatar, auth_provider`,
                    [
                        profile.displayName,
                        email,
                        profile.id,
                        profile.photos?.[0]?.value,
                        "google",
                    ]
                );

                return done(null, newUser.rows[0]);
            } catch (err) {
                console.error("Error in Google Strategy:", err);
                return done(err, null);
            }
        }
    )
);

// Serialize user into session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
