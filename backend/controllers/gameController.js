const { db } = require("../config/firebase");

exports.updateScore = async (req, res) => {
  try {
    const { score } = req.body;
    const uid = req.userId;

    console.log("Score update request:", { score, uid, scoreType: typeof score });

    if (!uid) {
      console.error("Score update failed: No user ID");
      return res.status(401).json({ msg: "Not authorized - No user ID" });
    }

    const scoreValue = typeof score === "number" ? score : Number(score);
    if (isNaN(scoreValue) || scoreValue < 0) {
      console.error("Score update failed: Invalid score value", score);
      return res.status(400).json({ msg: "Invalid score value" });
    }

    const userRef = db.ref(`users/${uid}`);
    const scoreRef = db.ref(`users/${uid}/score`);

    const userSnap = await userRef.once("value");
    if (!userSnap.exists()) {
      console.error(" Score update failed: User not found", uid);
      return res.status(404).json({ msg: "User not found" });
    }

    const result = await scoreRef.transaction((currentScore) => {
      const current = (currentScore === null || currentScore === undefined) 
        ? 0 
        : (typeof currentScore === "number" ? currentScore : Number(currentScore) || 0);
      
      const newScore = current + scoreValue;

      console.log("Transaction calculation:", { current, added: scoreValue, newScore });

      return newScore;
    });

    if (!result.committed) {
      console.error("Transaction failed to commit - retrying with direct update");
      const userData = userSnap.val();
      const current = typeof userData.score === "number" ? userData.score : 0;
      const newScore = current + scoreValue;
      
      await scoreRef.set(newScore);
      
      console.log("Score updated successfully (fallback):", { 
        userId: uid, 
        added: scoreValue, 
        newTotal: newScore 
      });
      
      return res.json({ msg: "Score updated", score: newScore, added: scoreValue });
    }

    const verifiedScore = typeof result.snapshot.val() === "number" 
      ? result.snapshot.val() 
      : Number(result.snapshot.val()) || 0;

    console.log("Score updated successfully (transaction):", { 
      userId: uid, 
      added: scoreValue, 
      newTotal: verifiedScore 
    });

    res.json({ msg: "Score updated", score: verifiedScore, added: scoreValue });
  } catch (err) {
    console.error("Score update error:", err);
    res.status(500).json({ msg: "Server error - Failed to update score", error: err.message });
  }
};

function maskEmail(email) {
  if (!email || typeof email !== "string") return "";

  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  const last4 = name.slice(-4);
  const stars = "*****";

  return stars + last4 + "@" + domain;
}

exports.leaderboard = async (req, res) => {
  try {
    const snap = await db.ref("users").once("value");

    if (!snap.exists()) return res.json([]);

    const leaderboard = Object.entries(snap.val())
      .map(([id, user]) => ({
        id: id,
        username: user.username || "Unknown",
        email: maskEmail(user.email || ""),
        score: typeof user.score === "number" ? user.score : 0,
        avatar: user.profile?.avatar || null
      }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.username || "").localeCompare(b.username || "");
      });

    res.json(leaderboard);

  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

