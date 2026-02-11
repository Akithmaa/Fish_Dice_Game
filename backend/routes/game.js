const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const game = require("../controllers/gameController");
const { validateScore } = require("../middleware/validation");
const { generalLimiter } = require("../middleware/rateLimiter");

router.post("/score", generalLimiter, authMiddleware, validateScore, game.updateScore);
router.get("/leaderboard", generalLimiter, game.leaderboard);



module.exports = router;


