module.exports = (req, res, next) => {

  try {

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ msg: "Not authenticated" });

    }
    req.userId = req.session.userId;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ msg: "Server error in auth middleware" });
  }

};


