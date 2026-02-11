const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);

};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 50;
};

//validates during signup
exports.validateSignup = (req, res, next) => {
  const { email, username, password } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ msg: "Invalid email format" });

  }
  if (!username || !validateUsername(username)) {
    return res.status(400).json({ msg: "Username must be between 3 and 50 characters" });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ msg: "Password must be at least 6 characters" });
  }
  next();

};

//validates login using either email or username
exports.validateLogin = (req, res, next) => {
  const { email, username, password } = req.body;
  const identifier = email || username;
  if (!identifier) {
    return res.status(400).json({ msg: "Email or username is required" });
  }

  if (identifier.includes('@')) {
    if (!validateEmail(identifier)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

  } else {
    if (!validateUsername(identifier)) {
      return res.status(400).json({ msg: "Username must be between 3 and 50 characters" });
    }

  }
  if (!password) {
    return res.status(400).json({ msg: "Password is required" });
  }
  next();

};

//for forgot password
exports.validatePasswordReset = (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }
  if (!newPassword || !validatePassword(newPassword)) {
    return res.status(400).json({ msg: "New password must be at least 6 characters" });
  }
  next();
};

//When verifying OTP
exports.validateOTP = (req, res, next) => {
  const { otpId, otp, newPassword, email } = req.body;
  if (!otpId || !otp || !email || !newPassword) {
    return res.status(400).json({ msg: "Missing required fields" });

  }

  if (!validateEmail(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ msg: "New password must be at least 6 characters" });

  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ msg: "OTP must be 6 digits" });
  }
  next();

};

//validateScore
exports.validateScore = (req, res, next) => {
  const { score } = req.body;
  const scoreValue = typeof score === "number" ? score : Number(score);
  if (isNaN(scoreValue) || scoreValue < 0 || !isFinite(scoreValue)) {
    console.error("Score validation failed:", { score, scoreType: typeof score, scoreValue });
    return res.status(400).json({ msg: "Invalid score value - must be a non-negative number" });
  }
  req.body.score = scoreValue;
  next();

};
