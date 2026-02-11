document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const modal = document.getElementById("profileModal");

  document.getElementById("profileNameModal").value = user.username;
  document.getElementById("profileEmailModal").value = user.email;

  const scoreField = document.getElementById("profileScoreModal");
  if (scoreField) scoreField.value = user.score || 0;

  if (user.profile?.avatar) {
    let avatarPath = user.profile.avatar;
    const characterMatch = avatarPath.match(/assets\/([A-Za-z]+)\.png$/);
    if (characterMatch) {
      const characterName = characterMatch[1].toLowerCase();
      const validCharacters = ['dolphin', 'jellyfish', 'octopus', 'seahorse', 'shark', 'whale'];
      if (validCharacters.includes(characterName)) {
        avatarPath = `assets/characters/${characterName}.png`;
        user.profile.avatar = avatarPath;
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
    
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.src = avatarPath;
    
    const avatarImg = document.getElementById("avatarImg");
    if (avatarImg) avatarImg.src = avatarPath;
  }

  const pass1 = document.getElementById("modalNewPassword");
  const pass2 = document.getElementById("modalConfirmPassword");
  const changeBtn = document.getElementById("modalChangePasswordBtn");

  changeBtn.onclick = async () => {
    const p1 = pass1.value.trim();
    const p2 = pass2.value.trim();

    if (!p1 || !p2) {
      if (typeof toast !== "undefined") {
        toast.warning("Fill both password fields.");
      } else {
        alert("Fill both password fields.");
      }
      return;
    }

    if (p1 !== p2) {
      if (typeof toast !== "undefined") {
        toast.error("Passwords do not match!");
      } else {
        alert("Passwords do not match!");
      }
      return;
    }

    if (p1.length < 6) {
      if (typeof toast !== "undefined") {
        toast.warning("Password must be at least 6 characters.");
      } else {
        alert("Password must be at least 6 characters.");
      }
      return;
    }

    if (typeof apiUpdatePassword === "function") {
      const res = await apiUpdatePassword(p1);
      
      if (res.msg === "Password updated successfully") {
        if (typeof toast !== "undefined") {
          toast.success("Password updated successfully!");
        } else {
          alert("Password updated successfully!");
        }
        pass1.value = "";
        pass2.value = "";
        modal.classList.remove("active");
        document.body.classList.remove("modal-open");
        if (typeof navigateTo === "function") {
          navigateTo("game");
        }
      } else {
        const msg = res.msg || "Failed to update password.";
        if (typeof toast !== "undefined") {
          toast.error(msg);
        } else {
          alert(msg);
        }
      }
    } else {
      const msg = "API function not available.";
      if (typeof toast !== "undefined") {
        toast.error(msg);
      } else {
        alert(msg);
      }
    }
  };

  const closeProfile = document.getElementById("closeProfile");
  if (closeProfile) {
    closeProfile.onclick = () => {
      modal.classList.remove("active");
      document.body.classList.remove("modal-open");
    };
  }

  async function refreshProfileData() {
    try {
      if (typeof getCurrentUser === 'function') {
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          document.getElementById("profileNameModal").value = updatedUser.username || "";
          document.getElementById("profileEmailModal").value = updatedUser.email || "";
          
          const scoreField = document.getElementById("profileScoreModal");
          if (scoreField) scoreField.value = updatedUser.score || 0;
          
          if (updatedUser.profile?.avatar) {
            let avatarPath = updatedUser.profile.avatar;
            const characterMatch = avatarPath.match(/assets\/([A-Za-z]+)\.png$/);
            if (characterMatch) {
              const characterName = characterMatch[1].toLowerCase();
              const validCharacters = ['dolphin', 'jellyfish', 'octopus', 'seahorse', 'shark', 'whale'];
              if (validCharacters.includes(characterName)) {
                avatarPath = `assets/characters/${characterName}.png`;
                updatedUser.profile.avatar = avatarPath;
                localStorage.setItem("user", JSON.stringify(updatedUser));
              }
            }
            
            const profileAvatar = document.getElementById("profileAvatar");
            if (profileAvatar) profileAvatar.src = avatarPath;
            
            const avatarImg = document.getElementById("avatarImg");
            if (avatarImg) avatarImg.src = avatarPath;
          }
          
          return updatedUser;
        }
      }
      
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        document.getElementById("profileNameModal").value = user.username || "";
        document.getElementById("profileEmailModal").value = user.email || "";
        const scoreField = document.getElementById("profileScoreModal");
        if (scoreField) scoreField.value = user.score || 0;
      }
    } catch (err) {
      console.error("Error refreshing profile data:", err);
    }
  }

  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.onclick = async () => {
      await refreshProfileData();
      modal.classList.add("active");
      document.body.classList.add("modal-open");
    };
  }


});

