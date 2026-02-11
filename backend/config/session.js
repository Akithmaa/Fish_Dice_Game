const session = require("express-session");

if (!process.env.SESSION_SECRET) {
  console.warn("WARNING: SESSION_SECRET not set in .env - using default (insecure for production)");

}
module.exports = session({
  name: 'connect.sid', 
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false, 
  saveUninitialized: false,
  rolling: true, 
  
  cookie: {
    httpOnly: true,
    secure: false, 
    sameSite: "lax",
    maxAge: 1000 * 60 * 30, //30 minutes
    path: '/', // Ensure cookie is available for all paths
    domain: undefined 

  }

});




