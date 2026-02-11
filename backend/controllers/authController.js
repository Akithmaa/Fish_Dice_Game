const { createUser, verifyUser } = require("../models/user");
const { db } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const transporter = require("../config/mail");

//signup
exports.signup = async (req, res) => {
  try {
    const { email, username, password, profile, rememberMe } = req.body;
    const user = await createUser({ email, username, password, profile });

    const userId = user.id || user.uid || user.userId;
    if (!userId) {
      console.error("Signup - No userId found in user object:", user);
      return res.status(500).json({ msg: "User ID not found" });
    }

    req.session.userId = userId;
    
    if (rememberMe) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 1 day
    }

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("Signup - Session save error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.session.userId) {
      console.error("CRITICAL: userId not set in session after save!");
      return res.status(500).json({ msg: "Failed to create session" });
    }

    const { passwordHash, ...safe } = user;
    console.log("Signup successful for:", safe.email || safe.username);
    
    res.json({ msg: "Signup successful", user: safe });
  } catch (err) {
    console.error("Signup Error:", err.message);
    if (err.message.includes("Session save") || err.message.includes("Session regenerate")) {
      res.status(500).json({ msg: "Session save failed" });
    } else {
      res.status(400).json({ msg: err.message });
    }
  }
};

//login
exports.login = async (req, res) => {
  try {
    const { email, username, password, rememberMe } = req.body;
    
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ msg: "Please provide email/username and password" });
    }

    const isEmail = identifier.includes('@');
    const user = await verifyUser({ 
      email: isEmail ? identifier : null, 
      username: isEmail ? null : identifier, 
      password 
    });
    if (!user) return res.status(401).json({ msg: "Invalid email/username or password" });

    const userId = user.id || user.uid || user.userId;
    if (!userId) {
      console.error("Login - No userId found in user object:", user);
      return res.status(500).json({ msg: "User ID not found" });
    }

    req.session.userId = userId;
    
    if (rememberMe) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; 
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 1 day
    }

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("Login - Session save error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.session.userId) {
      console.error("CRITICAL: userId not set in session after save!");
      return res.status(500).json({ msg: "Failed to create session" });
    }

    const { passwordHash, ...safe } = user;
    console.log("Login successful for:", safe.email || safe.username);
    
    res.json({ msg: "Login successful", user: safe });
  } catch (err) {
    console.error("Login Error:", err.message);
    if (err.message.includes("Session save") || err.message.includes("Session regenerate")) {
      res.status(500).json({ msg: "Session save failed" });
    } else {
      res.status(500).json({ msg: "Server error during login" });
    }
  }
};
//logout
exports.logout = (req, res) => {
  try {
    if (!req.session) {
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      return res.json({ msg: "Already logged out" });
    }

    const userId = req.session.userId;
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ msg: "Server error during logout" });
      }
      
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      
      if (userId) {
        console.log("Logout successful for userId:", userId);
      }
      
      res.json({ msg: "Logged out" });
    });
  } catch (err) {
    console.error("Logout Error:", err.message);
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    res.status(500).json({ msg: "Server error during logout" });
  }
};
//send otp 
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const userSnap = await db.ref("users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!userSnap.exists()) {
      return res.status(404).json({ msg: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = uuid();

    await db.ref(`otp/${otpId}`).set({
      email,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Fish Dice Password Reset OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ msg: "OTP sent", otpId });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ msg: "Server error sending OTP", error: err.message });
  }
};
//return logged-in user details.
exports.me = async (req, res) => {
  try {
    if (!req.session) {
      console.log(" /auth/me - No session object (cookies:", req.headers.cookie ? "present" : "missing", ")");
      return res.status(401).json({ 
        msg: "Not authenticated - No session found"
      });
    }

    if (!req.session.userId) {
      const sessionId = req.sessionID;
      await new Promise((resolve) => {
        req.session.destroy((err) => {
          if (err) {
            console.error("/auth/me - Error destroying invalid session:", err);
          }
          resolve();
        });
      });
      return res.status(401).json({ 
        msg: "Not authenticated - Please login"
      });
    }

    const userId = req.session.userId;
    const userSnap = await db.ref(`users/${userId}`).once("value");

    if (!userSnap.exists()) {
      console.log(" /auth/me - User not found:", userId);
      return res.status(404).json({ msg: "User not found" });
    }

    const user = userSnap.val();
    const { passwordHash, ...safe } = user;
    
    res.json({ id: userId, ...safe });
  } catch (err) {
    console.error("/auth/me error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ msg: "Missing email or new password" });
    }

    const userSnap = await db.ref("users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!userSnap.exists()) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userData = userSnap.val();
    const targetUserId = Object.keys(userData)[0];

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.ref(`users/${targetUserId}`).update({ passwordHash: hashed });

    return res.json({ msg: "Password updated successfully" });

  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ msg: "Server error updating password" });
  }
};
//test session
exports.testSession = (req, res) => {
  res.json({
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    userId: req.session?.userId || null,
    cookies: req.headers.cookie || "No cookies",
    origin: req.headers.origin || "No origin",
    timestamp: new Date().toISOString()
  });
};

//verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { otpId, otp, newPassword, email } = req.body;

    const snap = await db.ref(`otp/${otpId}`).once("value");
    if (!snap.exists()) return res.status(400).json({ msg: "Invalid request" });

    const data = snap.val();

    if (Date.now() > data.expiresAt)
      return res.status(400).json({ msg: "OTP expired" });

    if (otp !== data.otp)
      return res.status(400).json({ msg: "Invalid OTP" });

    const userSnap = await db.ref("users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!userSnap.exists()) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userData = userSnap.val();
    if (!userData || Object.keys(userData).length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userId = Object.keys(userData)[0];

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.ref(`users/${userId}`).update({ passwordHash: hashed });

    await db.ref(`otp/${otpId}`).remove();

    res.json({ msg: "Password updated successfully" });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ msg: "Error verifying OTP", error: err.message });
  }
};

