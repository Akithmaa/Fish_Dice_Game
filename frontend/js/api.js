const API_BASE_URL = "http://127.0.0.1:5000/api";

function notify(msg, type = "info") {
    if (typeof toast !== "undefined" && toast && typeof toast[type] === "function") {
        toast[type](msg);
    } else if (typeof toast !== "undefined" && toast && typeof toast.show === "function") {
        toast.show(msg, type);
    } else {
        alert(msg);
    }
}
//check sessions
async function getCurrentUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) return null;
        return await res.json();

    } catch (err) {
        console.error("Session check failed:", err);
        return null;
    }
}
//Logout
async function apiLogout() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        return res.ok;
    } catch (err) {
        console.error("Logout failed:", err);
        return false;
    }
}

async function performLogout() {
    try {
        if (window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
            console.log("Cleaning up game instance...");
            window.gameInstance.cleanup();
            window.gameInstance = null;
        }

        if (typeof gameState !== 'undefined' && gameState && typeof gameState.clear === 'function') {
            console.log("Clearing game state...");
            gameState.clear();
        }

        console.log("Logging out from server...");
        await apiLogout();

        const localStorageKeys = [
            "user",
            "isLoggedIn",
            "rememberMe",
            "selectedLevel",
            "sound",
            "musicEnabled",
            "undersea_game_state"
        ];
        
        localStorageKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        localStorage.clear();
        console.log("🧹 Cleared localStorage");

        sessionStorage.clear();
        console.log("🧹 Cleared sessionStorage");

        if (typeof navigateTo === 'function') {
            navigateTo('login');
        } else {
            window.location.href = "index.html#login";
        }
        
        console.log("✅ Logout completed successfully");
    } catch (err) {
        console.error("❌ Error during logout:", err);
        localStorage.clear();
        sessionStorage.clear();
        if (typeof navigateTo === 'function') {
            navigateTo('login');
        } else {
            window.location.href = "index.html#login";
        }
    }
}

if (typeof window !== 'undefined') {
    window.performLogout = performLogout;
}
//Svae score
async function apiSaveScore(score) {
    try {
        const sessionCheck = await getCurrentUser();
        if (!sessionCheck) {
            console.error("❌ Session expired or invalid");
            return { success: false, msg: "Not authenticated - Please log in again", status: 401 };
        }

        const scoreValue = typeof score === "number" ? score : Number(score);
        
        if (isNaN(scoreValue) || scoreValue < 0) {
            console.error("❌ Invalid score value:", score, typeof score);
            return { success: false, msg: "Invalid score value" };
        }

        console.log("📤 Sending score to server:", { score: scoreValue, type: typeof scoreValue });

        const res = await fetch(`${API_BASE_URL}/game/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ score: scoreValue })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ msg: "Unknown error" }));
            console.error("❌ Score save failed:", res.status, errorData);
            
            if (res.status === 401) {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("user");
            }
            
            const errorMsg = errorData.msg || "Failed to save score";
            return { success: false, msg: errorMsg, status: res.status };
        }

        const data = await res.json();
        console.log("✅ Score saved successfully:", data);
        return { success: true, ...data };

    } catch (err) {
        console.error("❌ Score save network error:", err);
        const errorMsg = "Network error - Score may not have been saved";
        return { success: false, msg: errorMsg, error: err };
    }
}

async function apiFetchLeaderboard() {
    try {
        const res = await fetch(`${API_BASE_URL}/game/leaderboard`, {
            method: "GET",
            credentials: "include"
        });

        return await res.json();

    } catch (err) {
        console.error("Leaderboard fetch failed:", err);
        return [];
    }
}
async function apiUpdatePassword(newPassword) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const res = await fetch(`${API_BASE_URL}/auth/update-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        newPassword
      })
    });

    return await res.json();

  } catch (err) {
    console.error("Password update failed:", err);
    return { msg: "Server unreachable" };
  }
}

